import type { Order, OrderItem, Customer, Prisma } from "@prisma/client";

import { safeSendEmail } from "./client";
import {
  orderCreatedEmail,
  orderPaidEmail,
  type OrderEmailData
} from "./templates";

type OrderWithItems = Order & { items: OrderItem[] };

function buildEmailData(input: {
  order: OrderWithItems;
  customer: Pick<Customer, "name" | "email">;
  baseUrl: string;
}): OrderEmailData {
  const { order, customer, baseUrl } = input;
  const ship = order.shippingAddress as Prisma.JsonObject;
  const paymentDetails = (order.paymentDetails ?? null) as
    | { initPoint?: string }
    | null;

  return {
    customerName: customer.name,
    orderNumber: order.number,
    orderUrl: `${baseUrl}/pedidos/${order.number}`,
    paymentMethod: order.paymentMethod,
    items: order.items.map((it) => ({
      productName: it.productName,
      variantLabel: it.variantLabel,
      quantity: it.quantity,
      unitPrice: it.unitPrice.toNumber(),
      totalPrice: it.totalPrice.toNumber()
    })),
    subtotal: order.subtotal.toNumber(),
    shippingCost: order.shippingCost.toNumber(),
    total: order.total.toNumber(),
    shippingMethod: order.shippingMethod,
    shippingAddress: {
      recipient: String(ship.recipient ?? ""),
      street: String(ship.street ?? ""),
      number: String(ship.number ?? ""),
      complement: ship.complement ? String(ship.complement) : null,
      district: String(ship.district ?? ""),
      city: String(ship.city ?? ""),
      state: String(ship.state ?? ""),
      cep: String(ship.cep ?? "")
    },
    payNowUrl: paymentDetails?.initPoint ?? null
  };
}

export async function sendOrderCreatedEmail(input: {
  order: OrderWithItems;
  customer: Pick<Customer, "name" | "email">;
  baseUrl: string;
}) {
  const data = buildEmailData(input);
  const { subject, html } = orderCreatedEmail(data);
  return safeSendEmail({
    to: input.customer.email,
    subject,
    html
  });
}

export async function sendOrderPaidEmail(input: {
  order: OrderWithItems;
  customer: Pick<Customer, "name" | "email">;
  baseUrl: string;
}) {
  const data = buildEmailData(input);
  const { subject, html } = orderPaidEmail(data);
  return safeSendEmail({
    to: input.customer.email,
    subject,
    html
  });
}
