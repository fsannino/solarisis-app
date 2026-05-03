import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderChannel, OrderStatus, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

import { ActionsPanel } from "./actions-panel";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagto",
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

const CHANNEL_LABEL: Record<OrderChannel, string> = {
  SITE: "Loja própria",
  ML: "Mercado Livre",
  SHOPEE: "Shopee",
  AMAZON: "Amazon",
  MAGALU: "Magalu",
  WHATSAPP: "WhatsApp"
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
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Todos os pedidos
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="display text-[clamp(28px,3vw,36px)]">
              #{order.number}
            </h1>
            <StatusPill status={order.status} />
            <PaymentPill status={order.paymentStatus} />
          </div>
          <p className="text-[13px] text-ink-soft">
            Criado em {formatDateTime(order.createdAt)} ·{" "}
            {CHANNEL_LABEL[order.channel]}
          </p>
        </div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-line bg-surface">
            <header className="border-b border-line px-5 py-3.5">
              <p className="eyebrow">Itens · {order.items.length}</p>
            </header>
            <ul className="divide-y divide-line">
              {order.items.map((it) => {
                const image = it.variant.product.images[0];
                return (
                  <li key={it.id} className="flex gap-4 px-5 py-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
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
                        className="font-medium text-ink hover:text-orange"
                      >
                        {it.productName}
                      </Link>
                      {it.variantLabel && (
                        <p className="text-[12px] text-ink-soft">
                          {it.variantLabel}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[11px] text-ink-faint">
                        SKU {it.variant.sku}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-faint">
                        Qtd. {it.quantity} ·{" "}
                        {formatBRL(it.unitPrice.toNumber())}
                      </p>
                    </div>
                    <p className="font-serif text-[15px] font-medium text-ink">
                      {formatBRL(it.totalPrice.toNumber())}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line px-5 py-4 text-[13px]">
              <Row
                label="Subtotal"
                value={formatBRL(order.subtotal.toNumber())}
              />
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
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-serif text-[14px] italic text-ink-soft">
                  Total
                </span>
                <span className="display text-[22px]">
                  {formatBRL(order.total.toNumber())}
                </span>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className="rounded-lg border border-line bg-surface p-5">
              <p className="eyebrow">Observações do cliente</p>
              <p className="mt-2 text-[14px] text-ink">{order.notes}</p>
            </section>
          )}

          <section className="rounded-lg border border-line bg-surface">
            <header className="border-b border-line px-5 py-3.5">
              <p className="eyebrow">Histórico</p>
            </header>
            <ol className="divide-y divide-line">
              {order.events.map((e, i) => {
                const isFirst = i === 0;
                return (
                  <li key={e.id} className="flex gap-3.5 px-5 py-3.5">
                    <span className="relative flex shrink-0 items-start pt-1">
                      <span
                        className={`block h-3 w-3 rounded-full ${
                          isFirst
                            ? "bg-orange ring-4 ring-orange-soft"
                            : "bg-line-strong"
                        }`}
                      />
                    </span>
                    <div>
                      <p
                        className={`text-[13px] ${isFirst ? "font-semibold text-ink" : "text-ink"}`}
                      >
                        {e.message}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        {formatDateTime(e.createdAt)} · {e.type}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow">Cliente</p>
            <p className="mt-3 text-[14px] font-medium text-ink">
              {order.customer.name}
            </p>
            <p className="text-[13px] text-ink-soft">
              {order.customer.email}
            </p>
            {order.customer.phone && (
              <p className="text-[13px] text-ink-soft">
                {order.customer.phone}
              </p>
            )}
            {order.customer.cpf && (
              <p className="mt-2 font-mono text-[11px] text-ink-faint">
                CPF {order.customer.cpf}
              </p>
            )}
            <span className="mt-3 inline-flex items-center rounded-full bg-orange-soft px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-orange">
              Cliente desde{" "}
              {order.customer.createdAt.toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric"
              })}
            </span>
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow">Pagamento</p>
            <div className="mt-3 rounded-md bg-sand px-3 py-3 text-[13px]">
              <Row
                label="Método"
                value={
                  PAYMENT_METHOD_LABEL[order.paymentMethod] ??
                  order.paymentMethod
                }
                bold
              />
              <Row
                label="Status"
                value={PAYMENT_STATUS_LABEL[order.paymentStatus]}
              />
              {order.paidAt && (
                <Row
                  label="Confirmado"
                  value={formatDateTime(order.paidAt)}
                />
              )}
              {paymentDetails?.last_four_digits != null &&
                typeof paymentDetails.last_four_digits === "string" && (
                  <Row
                    label="Cartão"
                    value={`Final ${paymentDetails.last_four_digits}`}
                  />
                )}
            </div>
            {order.gatewayId && (
              <p className="mt-2 break-all font-mono text-[10px] text-ink-faint">
                MP {order.gatewayId}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow">Entrega</p>
            <p className="mt-3 text-[13px] leading-[1.55] text-ink">
              {ship.recipient}
              <br />
              {ship.street}, {ship.number}
              {ship.complement ? ` · ${ship.complement}` : ""}
              <br />
              {ship.district} · {ship.city}/{ship.state}
              <br />
              <span className="text-ink-soft">CEP {ship.cep}</span>
            </p>
            {order.shippingMethod && (
              <p className="mt-3 text-[12px] text-ink-soft">
                <span className="eyebrow text-[10px]">Método</span>
                <br />
                {order.shippingMethod}
                {order.carrier ? ` · ${order.carrier}` : ""}
              </p>
            )}
            {order.trackingCode && (
              <p className="mt-3 text-[12px]">
                <span className="eyebrow text-[10px]">Rastreio</span>
                <br />
                <span className="font-mono text-[12px] font-semibold text-orange">
                  {order.trackingCode}
                </span>
              </p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow">Nota fiscal</p>
            {order.nfeKey ? (
              <div className="mt-3 space-y-1 text-[13px]">
                {order.nfeNumber && (
                  <p className="text-ink">
                    NF-e <strong>#{order.nfeNumber}</strong>
                  </p>
                )}
                <p className="break-all font-mono text-[10px] text-ink-faint">
                  {order.nfeKey}
                </p>
                {order.nfeUrl && (
                  <a
                    href={order.nfeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-mono text-[11px] font-semibold text-orange underline-offset-4 hover:underline"
                  >
                    Baixar PDF →
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-ink-soft">
                NF-e ainda não emitida.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow">Ações</p>
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

function Row({
  label,
  value,
  bold
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-ink-soft">{label}</span>
      <span className={bold ? "font-medium text-ink" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tones: Record<OrderStatus, string> = {
    PENDING: "bg-line text-ink-soft",
    PAID: "bg-orange-soft text-orange",
    PREPARING: "bg-orange-soft text-orange",
    SHIPPED: "bg-orange-soft text-orange",
    DELIVERED: "bg-green/20 text-green",
    CANCELED: "bg-line text-ink-faint",
    RETURNED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function PaymentPill({ status }: { status: PaymentStatus }) {
  const tones: Record<PaymentStatus, string> = {
    PENDING: "bg-line text-ink-soft",
    AUTHORIZED: "bg-line text-ink-soft",
    PAID: "bg-orange-soft text-orange",
    REFUNDED: "bg-line text-ink-faint",
    FAILED: "bg-destructive/15 text-destructive",
    CANCELED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      Pagto · {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
