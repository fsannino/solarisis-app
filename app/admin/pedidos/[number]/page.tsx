import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

import { ActionsPanel } from "./actions-panel";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pago",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  RETURNED: "Devolvido"
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
  CANCELED: "Cancelado"
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
  DEBIT_CARD: "Cartão de débito"
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `Pedido #${number} — Admin` };
}

function formatDateTime(d: Date) {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ number: string }>;
}) {
  await requireAdmin();
  const { number } = await params;

  const order = await prisma.order.findUnique({
    where: { number },
    include: {
      customer: true,
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 }
                }
              }
            }
          }
        }
      },
      events: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!order) notFound();

  const ship = order.shippingAddress as Record<string, string | null>;
  const paymentDetails = (order.paymentDetails ?? null) as Record<
    string,
    unknown
  > | null;

  return (
    <div>
      <header className="border-line flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <Link
            href="/admin/pedidos"
            className="text-ink-soft hover:text-ink text-xs underline-offset-4 hover:underline"
          >
            ← Todos os pedidos
          </Link>
          <h1 className="font-serif mt-2 text-3xl italic">
            Pedido #{order.number}
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            Criado em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={order.status} />
          <PaymentPill status={order.paymentStatus} />
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal */}
        <div className="flex flex-col gap-8">
          <section className="bg-surface border-line rounded-lg border">
            <div className="border-line border-b px-5 py-3">
              <p className="text-ink-soft text-xs uppercase tracking-widest">
                Itens · {order.items.length}
              </p>
            </div>
            <ul className="divide-line divide-y">
              {order.items.map((it) => {
                const image = it.variant.product.images[0];
                return (
                  <li key={it.id} className="flex gap-4 p-4">
                    <div className="bg-line relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                      {image && (
                        <Image
                          src={image.url}
                          alt={image.alt ?? it.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col text-sm">
                      <Link
                        href={`/admin/produtos/${it.variant.product.id}`}
                        className="text-ink hover:text-orange font-medium"
                      >
                        {it.productName}
                      </Link>
                      {it.variantLabel && (
                        <p className="text-ink-soft text-xs">{it.variantLabel}</p>
                      )}
                      <p className="text-ink-faint mt-0.5 font-mono text-[11px]">
                        SKU {it.variant.sku}
                      </p>
                      <p className="text-ink-faint mt-0.5 text-xs">
                        {it.quantity} × {formatBRL(it.unitPrice.toNumber())}
                      </p>
                    </div>
                    <p className="text-ink text-sm">
                      {formatBRL(it.totalPrice.toNumber())}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="border-line border-t p-4 text-sm">
              <Row label="Subtotal" value={formatBRL(order.subtotal.toNumber())} />
              <Row
                label={`Frete${order.shippingMethod ? ` · ${order.shippingMethod}` : ""}`}
                value={
                  order.shippingCost.toNumber() === 0
                    ? "Grátis"
                    : formatBRL(order.shippingCost.toNumber())
                }
              />
              {order.discount.toNumber() > 0 && (
                <Row
                  label="Desconto"
                  value={`− ${formatBRL(order.discount.toNumber())}`}
                />
              )}
              <div className="border-line mt-2 flex justify-between border-t pt-2 font-serif text-lg italic">
                <span>Total</span>
                <span>{formatBRL(order.total.toNumber())}</span>
              </div>
            </div>
          </section>

          <section className="bg-surface border-line grid gap-6 rounded-lg border p-5 md:grid-cols-2">
            <div>
              <p className="text-ink-soft text-xs uppercase tracking-widest">
                Cliente
              </p>
              <p className="text-ink mt-2 text-sm font-medium">
                {order.customer.name}
              </p>
              <p className="text-ink-soft text-sm">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-ink-soft text-sm">{order.customer.phone}</p>
              )}
              {order.customer.cpf && (
                <p className="text-ink-faint mt-1 font-mono text-xs">
                  CPF {order.customer.cpf}
                </p>
              )}
            </div>
            <div>
              <p className="text-ink-soft text-xs uppercase tracking-widest">
                Entrega
              </p>
              <p className="text-ink mt-2 text-sm leading-relaxed">
                {ship.recipient}
                <br />
                {ship.street}, {ship.number}
                {ship.complement ? ` · ${ship.complement}` : ""}
                <br />
                {ship.district} · {ship.city}/{ship.state}
                <br />
                CEP {ship.cep}
              </p>
              {order.trackingCode && (
                <p className="text-ink-soft mt-3 text-xs">
                  <span className="text-ink-faint uppercase tracking-widest">
                    Rastreio
                  </span>
                  <br />
                  <span className="text-ink font-mono text-sm">
                    {order.trackingCode}
                  </span>
                  {order.carrier ? ` · ${order.carrier}` : ""}
                </p>
              )}
            </div>
          </section>

          {order.notes && (
            <section className="bg-surface border-line rounded-lg border p-5">
              <p className="text-ink-soft text-xs uppercase tracking-widest">
                Observações do cliente
              </p>
              <p className="text-ink mt-2 text-sm">{order.notes}</p>
            </section>
          )}

          <section className="bg-surface border-line rounded-lg border">
            <div className="border-line border-b px-5 py-3">
              <p className="text-ink-soft text-xs uppercase tracking-widest">
                Histórico
              </p>
            </div>
            <ol className="divide-line divide-y">
              {order.events.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 px-5 py-3">
                  <p className="text-ink text-sm">{e.message}</p>
                  <p className="text-ink-faint text-xs">
                    {formatDateTime(e.createdAt)} · {e.type}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Coluna lateral */}
        <aside className="flex flex-col gap-6">
          <section className="bg-surface border-line rounded-lg border p-5">
            <p className="text-ink-soft text-xs uppercase tracking-widest">
              Pagamento
            </p>
            <p className="text-ink mt-2 text-sm">
              {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
            <p className="text-ink-soft mt-1 text-xs">
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </p>
            {order.gatewayId && (
              <p className="text-ink-faint mt-2 font-mono text-[11px]">
                MP ID {order.gatewayId.slice(0, 18)}…
              </p>
            )}
            {paymentDetails?.last_four_digits != null &&
              typeof paymentDetails.last_four_digits === "string" && (
                <p className="text-ink-soft mt-1 text-xs">
                  Final {paymentDetails.last_four_digits}
                </p>
              )}
            {order.paidAt && (
              <p className="text-ink-soft mt-2 text-xs">
                Pago em {formatDateTime(order.paidAt)}
              </p>
            )}
          </section>

          <section className="bg-surface border-line rounded-lg border p-5">
            <p className="text-ink-soft text-xs uppercase tracking-widest">
              Nota fiscal
            </p>
            {order.nfeKey ? (
              <div className="mt-2 space-y-1 text-sm">
                {order.nfeNumber && (
                  <p className="text-ink">
                    NF-e <strong>#{order.nfeNumber}</strong>
                  </p>
                )}
                <p className="text-ink-faint break-all font-mono text-[11px]">
                  {order.nfeKey}
                </p>
                {order.nfeUrl && (
                  <a
                    href={order.nfeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange hover:underline text-xs underline-offset-4"
                  >
                    Baixar PDF →
                  </a>
                )}
              </div>
            ) : (
              <p className="text-ink-soft mt-2 text-xs">
                NF-e ainda não emitida. Emita pelo painel de ações abaixo.
              </p>
            )}
          </section>

          <section className="bg-surface border-line rounded-lg border p-5">
            <p className="text-ink-soft text-xs uppercase tracking-widest">
              Ações
            </p>
            <div className="mt-3">
              <ActionsPanel
                number={order.number}
                status={order.status}
                paymentStatus={order.paymentStatus}
                hasInvoice={Boolean(order.nfeKey)}
                carrierDefault={order.carrier}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-ink-soft">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tones: Record<OrderStatus, string> = {
    PENDING: "bg-bg text-ink-soft border-line",
    PAID: "bg-orange-soft text-ink border-orange/30",
    PREPARING: "bg-orange-soft text-ink border-orange/30",
    SHIPPED: "bg-orange-soft text-ink border-orange/30",
    DELIVERED: "bg-line text-ink border-line-strong",
    CANCELED: "bg-bg text-ink-faint border-line",
    RETURNED: "bg-bg text-ink-faint border-line"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function PaymentPill({ status }: { status: PaymentStatus }) {
  const tones: Record<PaymentStatus, string> = {
    PENDING: "bg-bg text-ink-soft border-line",
    AUTHORIZED: "bg-bg text-ink-soft border-line",
    PAID: "bg-orange-soft text-ink border-orange/30",
    REFUNDED: "bg-bg text-ink-faint border-line",
    FAILED: "bg-destructive/10 text-destructive border-destructive/30",
    CANCELED: "bg-bg text-ink-faint border-line"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[status]}`}
    >
      Pagto · {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
