"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  sendOrderInvoiceEmail,
  sendOrderShippedEmail
} from "@/lib/email/order-emails";
import { getBaseUrl } from "@/lib/mercadopago";
import { emitNfe } from "@/lib/bling/nfe";

export type AdminOrderActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function loadOrder(number: string) {
  return prisma.order.findUnique({
    where: { number },
    include: {
      items: true,
      customer: { select: { name: true, email: true } }
    }
  });
}

function authorOf(session: Awaited<ReturnType<typeof requireAdmin>>) {
  return session.user.email ?? session.user.id;
}

export async function markAsPreparing(
  formData: FormData
): Promise<AdminOrderActionResult> {
  const session = await requireAdmin();
  const number = String(formData.get("number") ?? "");
  if (!number) return { ok: false, error: "Pedido inválido." };

  const order = await loadOrder(number);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "PAID") {
    return { ok: false, error: "Só pedidos pagos podem entrar em separação." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PREPARING" }
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "status_changed",
        message: "Em separação.",
        createdBy: session.user.id
      }
    })
  ]);

  revalidatePath(`/admin/pedidos`);
  revalidatePath(`/admin/pedidos/${order.number}`);
  return { ok: true };
}

const shippedSchema = z.object({
  number: z.string().min(1),
  trackingCode: z
    .string()
    .min(3, "Informe o código de rastreio")
    .max(40),
  carrier: z.string().min(2, "Informe a transportadora").max(80)
});

export async function markAsShipped(
  formData: FormData
): Promise<AdminOrderActionResult> {
  const session = await requireAdmin();
  const parsed = shippedSchema.safeParse({
    number: formData.get("number"),
    trackingCode: formData.get("trackingCode"),
    carrier: formData.get("carrier")
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos."
    };
  }

  const order = await loadOrder(parsed.data.number);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (!["PAID", "PREPARING"].includes(order.status)) {
    return {
      ok: false,
      error: "Só pedidos pagos ou em separação podem ser enviados."
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "SHIPPED",
        trackingCode: parsed.data.trackingCode,
        carrier: parsed.data.carrier,
        shippedAt: order.shippedAt ?? new Date()
      }
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "shipped",
        message: `Pedido enviado via ${parsed.data.carrier}.`,
        metadata: { trackingCode: parsed.data.trackingCode },
        createdBy: session.user.id
      }
    });
    return u;
  });

  if (order.customer.email) {
    try {
      const baseUrl = await getBaseUrl();
      const fullOrder = await prisma.order.findUnique({
        where: { id: updated.id },
        include: { items: true }
      });
      if (fullOrder) {
        await sendOrderShippedEmail({
          order: fullOrder,
          customer: order.customer,
          baseUrl,
          trackingCode: parsed.data.trackingCode,
          carrier: parsed.data.carrier
        });
      }
    } catch (err) {
      console.error("[email] erro ao enviar pedido_enviado:", err);
    }
  }

  revalidatePath(`/admin/pedidos`);
  revalidatePath(`/admin/pedidos/${order.number}`);
  return { ok: true };
}

export async function markAsDelivered(
  formData: FormData
): Promise<AdminOrderActionResult> {
  const session = await requireAdmin();
  const number = String(formData.get("number") ?? "");
  if (!number) return { ok: false, error: "Pedido inválido." };

  const order = await loadOrder(number);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "SHIPPED") {
    return { ok: false, error: "Só pedidos enviados podem ser marcados como entregues." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "DELIVERED", deliveredAt: new Date() }
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "delivered",
        message: "Pedido entregue.",
        createdBy: session.user.id
      }
    })
  ]);

  revalidatePath(`/admin/pedidos`);
  revalidatePath(`/admin/pedidos/${order.number}`);
  return { ok: true };
}

export async function emitInvoice(
  formData: FormData
): Promise<AdminOrderActionResult> {
  const session = await requireAdmin();
  const number = String(formData.get("number") ?? "");
  if (!number) return { ok: false, error: "Pedido inválido." };

  const order = await prisma.order.findUnique({
    where: { number },
    include: {
      customer: true,
      items: { include: { variant: { select: { sku: true } } } }
    }
  });
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.paymentStatus !== "PAID") {
    return {
      ok: false,
      error: "Só pedidos com pagamento confirmado podem emitir NF-e."
    };
  }
  if (order.nfeKey) {
    return { ok: false, error: "Esse pedido já tem NF-e emitida." };
  }

  const result = await emitNfe({
    order,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      cpf: order.customer.cpf,
      phone: order.customer.phone
    }
  });

  if (!result.ok) {
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "nfe_failed",
        message: `Falha ao emitir NF-e: ${result.error}`,
        metadata: { error: result.error },
        createdBy: session.user.id
      }
    });
    revalidatePath(`/admin/pedidos/${order.number}`);
    return { ok: false, error: result.error };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        nfeNumber: result.number,
        nfeKey: result.key,
        nfeUrl: result.url
      }
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: result.pending ? "nfe_pending" : "nfe_emitted",
        message: result.pending
          ? "NF-e enviada à SEFAZ, aguardando autorização."
          : `NF-e emitida${result.number ? ` (#${result.number})` : ""}.`,
        metadata: {
          blingId: result.blingId,
          number: result.number,
          key: result.key
        },
        createdBy: session.user.id
      }
    })
  ]);

  if (!result.pending && result.url && order.customer.email) {
    try {
      const baseUrl = await getBaseUrl();
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true }
      });
      if (fullOrder) {
        await sendOrderInvoiceEmail({
          order: fullOrder,
          customer: { name: order.customer.name, email: order.customer.email },
          baseUrl,
          nfeNumber: result.number,
          nfeUrl: result.url
        });
      }
    } catch (err) {
      console.error("[email] erro ao enviar nfe_emitida:", err);
    }
  }

  revalidatePath(`/admin/pedidos`);
  revalidatePath(`/admin/pedidos/${order.number}`);
  return { ok: true };
}

const cancelSchema = z.object({
  number: z.string().min(1),
  reason: z.string().min(2, "Informe o motivo").max(280)
});

export async function cancelOrder(
  formData: FormData
): Promise<AdminOrderActionResult> {
  const session = await requireAdmin();
  const parsed = cancelSchema.safeParse({
    number: formData.get("number"),
    reason: formData.get("reason")
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos."
    };
  }

  const order = await loadOrder(parsed.data.number);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if ((["DELIVERED", "CANCELED"] as OrderStatus[]).includes(order.status)) {
    return {
      ok: false,
      error: "Esse pedido não pode mais ser cancelado."
    };
  }

  const shouldRestock = order.status !== "SHIPPED";

  await prisma.$transaction(async (tx) => {
    if (shouldRestock) {
      for (const it of order.items) {
        await tx.productVariant.update({
          where: { id: it.variantId },
          data: { stock: { increment: it.quantity } }
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date()
      }
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "canceled",
        message: `Pedido cancelado: ${parsed.data.reason}`,
        metadata: {
          reason: parsed.data.reason,
          restocked: shouldRestock,
          canceledBy: authorOf(session)
        },
        createdBy: session.user.id
      }
    });
  });

  revalidatePath(`/admin/pedidos`);
  revalidatePath(`/admin/pedidos/${order.number}`);
  return { ok: true };
}
