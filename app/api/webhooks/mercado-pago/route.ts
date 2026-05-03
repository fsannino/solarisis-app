import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  getBaseUrl,
  getPayment,
  verifyWebhookSignature
} from "@/lib/mercadopago";
import { sendOrderPaidEmail } from "@/lib/email/order-emails";
import {
  PaymentStatus as PrismaPaymentStatus,
  OrderStatus as PrismaOrderStatus
} from "@prisma/client";

/**
 * Webhook do Mercado Pago.
 *
 * Doc: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Recebemos notificações pra "payment.created" / "payment.updated".
 * Buscamos o pagamento real via API (nunca confiar no body) e
 * atualizamos Order.paymentStatus + Order.status conforme o resultado.
 */
export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id");
  const signatureHeader = req.headers.get("x-signature");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid json" },
      { status: 400 }
    );
  }

  const type = (body.type ?? body.action) as string | undefined;
  const dataObj = body.data as { id?: string | number } | undefined;
  const resourceId = dataObj?.id?.toString();

  if (!resourceId || !type) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Aceita só notificações de pagamento por enquanto (merchant_order virá
  // se ativarmos no painel do MP).
  if (!type.startsWith("payment")) {
    return NextResponse.json({ ignored: true });
  }

  if (
    !verifyWebhookSignature({
      signatureHeader,
      requestId,
      resourceId
    })
  ) {
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 }
    );
  }

  const payment = await getPayment(resourceId).catch((err) => {
    console.error("[mercado-pago] erro ao buscar pagamento:", err);
    return null;
  });
  if (!payment) {
    // 404/erro do MP — devolve 200 pra não retentar infinitamente.
    return NextResponse.json({ ok: true, note: "payment not found" });
  }

  const orderNumber = payment.external_reference;
  if (!orderNumber) {
    return NextResponse.json({ ok: true, note: "no external_reference" });
  }

  const order = await prisma.order.findUnique({
    where: { number: orderNumber }
  });
  if (!order) {
    return NextResponse.json({ ok: true, note: "order not found" });
  }

  const mpStatus = payment.status; // approved | pending | rejected | cancelled | refunded | in_process | authorized
  const next = mapStatus(mpStatus);

  if (
    order.paymentStatus === next.paymentStatus &&
    order.status === next.orderStatus
  ) {
    return NextResponse.json({ ok: true, note: "no change" });
  }

  const becamePaid =
    next.paymentStatus === "PAID" && order.paymentStatus !== "PAID";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: next.paymentStatus,
        status: next.orderStatus,
        gatewayId: String(payment.id ?? order.gatewayId ?? ""),
        paymentDetails: {
          status: mpStatus,
          status_detail: payment.status_detail,
          payment_method_id: payment.payment_method_id,
          payment_type_id: payment.payment_type_id,
          last_four_digits:
            payment.card?.last_four_digits ?? null
        },
        paidAt:
          next.paymentStatus === "PAID" && !order.paidAt
            ? new Date()
            : order.paidAt,
        canceledAt:
          next.orderStatus === "CANCELED" && !order.canceledAt
            ? new Date()
            : order.canceledAt
      }
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: `payment_${mpStatus}`,
        message: `Pagamento ${mpStatus} via Mercado Pago.`,
        metadata: {
          paymentId: String(payment.id),
          status: mpStatus,
          status_detail: payment.status_detail
        }
      }
    });
  });

  if (becamePaid) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: order.customerId },
        select: { name: true, email: true }
      });
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true }
      });
      if (customer?.email && fullOrder) {
        const baseUrl = await getBaseUrl();
        await sendOrderPaidEmail({
          order: fullOrder,
          customer,
          baseUrl
        });
      }
    } catch (err) {
      console.error("[email] erro ao enviar pagamento_aprovado:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

function mapStatus(mp: string | undefined): {
  paymentStatus: PrismaPaymentStatus;
  orderStatus: PrismaOrderStatus;
} {
  switch (mp) {
    case "approved":
      return { paymentStatus: "PAID", orderStatus: "PAID" };
    case "authorized":
      return { paymentStatus: "AUTHORIZED", orderStatus: "PENDING" };
    case "in_process":
    case "pending":
      return { paymentStatus: "PENDING", orderStatus: "PENDING" };
    case "rejected":
      return { paymentStatus: "FAILED", orderStatus: "PENDING" };
    case "cancelled":
      return { paymentStatus: "CANCELED", orderStatus: "CANCELED" };
    case "refunded":
    case "charged_back":
      return { paymentStatus: "REFUNDED", orderStatus: "CANCELED" };
    default:
      return { paymentStatus: "PENDING", orderStatus: "PENDING" };
  }
}
