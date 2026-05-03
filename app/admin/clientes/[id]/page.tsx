import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CustomerSegment, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  VIP: "VIP",
  REGULAR: "Regular",
  NEW: "Nova",
  AT_RISK: "Em risco",
  CHURNED: "Inativa"
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagto",
  PAID: "Pago",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  RETURNED: "Devolvido"
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function fmtDateLong(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function daysSince(d: Date | null, now: number) {
  if (!d) return null;
  return Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await prisma.customer.findUnique({
    where: { id },
    select: { name: true }
  });
  return { title: `${c?.name ?? "Cliente"} — Admin` };
}

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          items: { select: { quantity: true } }
        }
      }
    }
  });

  if (!customer) notFound();

  const nowMs = new Date().getTime();
  const ltv = customer.totalSpent.toNumber();
  const aov =
    customer.ordersCount > 0
      ? ltv / customer.ordersCount
      : 0;
  const lastOrderDays = daysSince(customer.lastOrderAt, nowMs);

  const monthsActive = Math.max(
    1,
    Math.floor(
      (nowMs - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
  );
  const orderRate = (customer.ordersCount / monthsActive).toFixed(1);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]">
        <Link
          href="/admin/clientes"
          className="text-ink-soft hover:text-ink"
        >
          ← Clientes
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-ink">{customer.name}</span>
      </nav>

      {/* Header card */}
      <section className="rounded-lg border border-line bg-surface p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-soft font-mono text-[20px] font-bold text-orange">
              {initials(customer.name)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display text-[clamp(28px,3vw,32px)]">
                  {customer.name}
                </h1>
                <SegmentPill segment={customer.segment} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-soft">
                <InfoLine icon="mail" label={customer.email} />
                {customer.phone && (
                  <InfoLine icon="phone" label={customer.phone} />
                )}
                {customer.addresses[0] && (
                  <InfoLine
                    icon="map"
                    label={`${customer.addresses[0].city}/${customer.addresses[0].state}`}
                  />
                )}
                <InfoLine
                  icon="calendar"
                  label={`Desde ${fmtDateLong(customer.createdAt)}`}
                />
              </div>
              {customer.cpf && (
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  CPF {customer.cpf}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="LTV" value={formatBRL(ltv)} hint="Receita total" />
        <KpiTile
          label="Pedidos"
          value={customer.ordersCount.toString()}
          hint={`${orderRate}/mês em média`}
        />
        <KpiTile
          label="Ticket médio"
          value={aov > 0 ? formatBRL(aov) : "—"}
          hint="AOV pessoal"
        />
        <KpiTile
          label="Último pedido"
          value={
            lastOrderDays !== null
              ? lastOrderDays === 0
                ? "hoje"
                : `há ${lastOrderDays}d`
              : "—"
          }
          hint={fmtDate(customer.lastOrderAt)}
        />
      </section>

      {/* Pedidos + Endereços */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-lg border border-line bg-surface">
          <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <p className="eyebrow">Pedidos</p>
            <span className="text-[12px] text-ink-faint">
              últimos {customer.orders.length}
            </span>
          </header>
          {customer.orders.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-soft">
              Cliente ainda não fez pedidos.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {customer.orders.map((o) => {
                const itemCount = o.items.reduce(
                  (s, it) => s + it.quantity,
                  0
                );
                return (
                  <li key={o.id} className="px-5 py-3.5">
                    <Link
                      href={`/admin/pedidos/${o.number}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="font-mono text-[12px] font-medium text-orange">
                          #{o.number}
                        </span>
                        <span className="text-[12px] text-ink-soft">
                          {o.createdAt.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short"
                          })}
                        </span>
                        <span className="text-[12px] text-ink-soft">
                          {itemCount}{" "}
                          {itemCount === 1 ? "item" : "itens"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusPill status={o.status} />
                        <span className="font-serif text-[14px] font-medium text-ink">
                          {formatBRL(o.total.toNumber())}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-line bg-surface">
          <header className="border-b border-line px-5 py-3.5">
            <p className="eyebrow">Endereços</p>
          </header>
          {customer.addresses.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-ink-soft">
              Sem endereços cadastrados.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {customer.addresses.map((a) => (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-ink">
                      {a.label ?? a.recipient}
                    </p>
                    {a.isDefault && (
                      <span className="rounded-full bg-orange-soft px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-orange">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-soft">
                    {a.street}, {a.number}
                    {a.complement ? ` · ${a.complement}` : ""}
                    <br />
                    {a.district} · {a.city}/{a.state}
                    <br />
                    CEP {a.cep}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Marketing */}
      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <p className="eyebrow">Marketing</p>
        <p className="mt-3 text-[13px] text-ink">
          {customer.marketingOptIn ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-green mr-2 align-middle" />
              Optou por receber comunicações
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-ink-faint mr-2 align-middle" />
              Não optou por receber comunicações
            </>
          )}
        </p>
      </section>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border border-line bg-surface p-5">
      <p className="eyebrow">{label}</p>
      <p className="display mt-2 text-[26px]">{value}</p>
      <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>
    </div>
  );
}

function SegmentPill({ segment }: { segment: CustomerSegment }) {
  const tones: Record<CustomerSegment, string> = {
    VIP: "bg-orange-soft text-orange",
    REGULAR: "bg-green/20 text-green",
    NEW: "bg-line text-ink-soft",
    AT_RISK: "bg-orange-soft/60 text-orange",
    CHURNED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[segment]}`}
    >
      {SEGMENT_LABEL[segment]}
    </span>
  );
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function InfoLine({
  icon,
  label
}: {
  icon: "mail" | "phone" | "map" | "calendar";
  label: string;
}) {
  const icons = {
    mail: (
      <path d="M4 4h16v16H4zM4 4l8 8 8-8" />
    ),
    phone: (
      <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
    ),
    map: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    )
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint">
        {icons[icon]}
      </svg>
      {label}
    </span>
  );
}
