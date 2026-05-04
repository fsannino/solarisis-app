"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export type ReturnFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type ReturnActionResult = { ok: true } | { ok: false; error: string };

const itemSchema = z.object({
  orderItemId: z.string().min(1),
  qty: z.coerce.number().int().min(1).max(99),
  condition: z.enum(["new", "used", "damaged"])
});

const createSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(2, "Informe o motivo").max(80),
  reasonDetail: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Selecione pelo menos um item")
});

async function nextReturnNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.return.count({
    where: { number: { startsWith: `RMA-${year}-` } }
  });
  const seq = String(count + 1).padStart(3, "0");
  return `RMA-${year}-${seq}`;
}

export async function createReturn(
  _prev: ReturnFormState | undefined,
  formData: FormData
): Promise<ReturnFormState> {
  await requireAdmin();

  const itemsRaw = formData.getAll("items").map((v) => {
    try {
      return JSON.parse(String(v));
    } catch {
      return null;
    }
  });

  const parsed = createSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
    reasonDetail: formData.get("reasonDetail") ?? "",
    items: itemsRaw.filter(Boolean)
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, customerId: true, items: { select: { id: true } } }
  });
  if (!order) return { ok: false, error: "Pedido não encontrado." };

  const validItemIds = new Set(order.items.map((i) => i.id));
  const allValid = parsed.data.items.every((i) =>
    validItemIds.has(i.orderItemId)
  );
  if (!allValid) {
    return { ok: false, error: "Algum item não pertence a esse pedido." };
  }

  const number = await nextReturnNumber();
  const created = await prisma.return.create({
    data: {
      number,
      orderId: order.id,
      customerId: order.customerId,
      reason: parsed.data.reason,
      reasonDetail:
        parsed.data.reasonDetail && parsed.data.reasonDetail.length > 0
          ? parsed.data.reasonDetail
          : null,
      status: "REQUESTED",
      items: parsed.data.items as unknown as Prisma.InputJsonValue
    }
  });

  revalidatePath("/admin/devolucoes");
  redirect(`/admin/devolucoes/${created.number}`);
}

async function loadByNumber(number: string) {
  return prisma.return.findUnique({ where: { number } });
}

export async function approveReturn(
  formData: FormData
): Promise<ReturnActionResult> {
  await requireAdmin();
  const number = String(formData.get("number") ?? "");
  const r = await loadByNumber(number);
  if (!r) return { ok: false, error: "Devolução não encontrada." };
  if (r.status !== "REQUESTED") {
    return { ok: false, error: "Só devoluções solicitadas podem ser aprovadas." };
  }
  await prisma.return.update({
    where: { id: r.id },
    data: { status: "APPROVED" }
  });
  revalidatePath("/admin/devolucoes");
  revalidatePath(`/admin/devolucoes/${number}`);
  return { ok: true };
}

export async function rejectReturn(
  formData: FormData
): Promise<ReturnActionResult> {
  await requireAdmin();
  const number = String(formData.get("number") ?? "");
  const r = await loadByNumber(number);
  if (!r) return { ok: false, error: "Devolução não encontrada." };
  if (r.status !== "REQUESTED") {
    return { ok: false, error: "Só devoluções solicitadas podem ser recusadas." };
  }
  await prisma.return.update({
    where: { id: r.id },
    data: { status: "REJECTED" }
  });
  revalidatePath("/admin/devolucoes");
  revalidatePath(`/admin/devolucoes/${number}`);
  return { ok: true };
}

export async function markReceived(
  formData: FormData
): Promise<ReturnActionResult> {
  await requireAdmin();
  const number = String(formData.get("number") ?? "");
  const r = await loadByNumber(number);
  if (!r) return { ok: false, error: "Devolução não encontrada." };
  if (r.status !== "APPROVED") {
    return { ok: false, error: "Só devoluções aprovadas podem ser recebidas." };
  }
  await prisma.return.update({
    where: { id: r.id },
    data: { status: "RECEIVED" }
  });
  revalidatePath("/admin/devolucoes");
  revalidatePath(`/admin/devolucoes/${number}`);
  return { ok: true };
}

const refundSchema = z.object({
  number: z.string().min(1),
  refundAmount: z.coerce.number().min(0).max(99999),
  refundMethod: z.enum(["pix", "estorno_cartao", "credito_loja"])
});

export async function markRefunded(
  formData: FormData
): Promise<ReturnActionResult> {
  await requireAdmin();
  const parsed = refundSchema.safeParse({
    number: formData.get("number"),
    refundAmount: formData.get("refundAmount"),
    refundMethod: formData.get("refundMethod")
  });
  if (!parsed.success) {
    return { ok: false, error: "Informe valor e método de reembolso." };
  }
  const r = await loadByNumber(parsed.data.number);
  if (!r) return { ok: false, error: "Devolução não encontrada." };
  if (r.status !== "RECEIVED") {
    return {
      ok: false,
      error: "Só devoluções recebidas podem ser reembolsadas."
    };
  }
  await prisma.return.update({
    where: { id: r.id },
    data: {
      status: "REFUNDED",
      refundAmount: parsed.data.refundAmount,
      refundMethod: parsed.data.refundMethod
    }
  });
  revalidatePath("/admin/devolucoes");
  revalidatePath(`/admin/devolucoes/${parsed.data.number}`);
  return { ok: true };
}
