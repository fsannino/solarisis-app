import Link from "next/link";
import {
  Prisma,
  OrderStatus,
  OrderChannel,
  PaymentStatus
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  status?: string;
  q?: string;
  canal?: string;
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PAID", label: "Pagos" },
  { value: "PREPARING", label: "Em separação" },
  { value: "SHIPPED", label: "Enviados" },
  { value: "DELIVERED", label: "Entregues" },
  { value: "CANCELED", label: "Cancelados" }
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagto",
  PAID: "Pago",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  RETURNED: "Devolvido"
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "—",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
  CANCELED: "Cancelado"
};

const CHANNEL_LABEL: Record<OrderChannel, string> = {
  SITE: "Loja própria",
  ML: "Mercado Livre",
  SHOPEE: "Shopee",
  AMAZON: "Amazon",
  MAGALU: "Magalu",
  WHATSAPP: "WhatsApp"
};

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.status) params.set("status", merged.status);
  if (merged.q) params.set("q", merged.q);
  if (merged.canal) params.set("canal", merged.canal);
  const qs = params.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status?.trim();
  const q = sp.q?.trim();
  const canal = sp.canal?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (
    status &&
    [
      "PENDING",
      "PAID",
      "PREPARING",
      "SHIPPED",
      "DELIVERED",
      "CANCELED",
      "RETURNED"
    ].includes(status)
  ) {
    where.status = status as OrderStatus;
  }
  if (
    canal &&
    ["SITE", "ML", "SHOPEE", "AMAZON", "MAGALU", "WHATSAPP"].includes(canal)
  ) {
    where.channel = canal as OrderChannel;
  }
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [orders, counts, revenueAgg, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: { select: { name: true, email: true } },
        items: { select: { quantity: true } }
      }
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID" }
    }),
    prisma.order.count({ where: { status: "PENDING" } })
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  );
  const totalAll = counts.reduce((s, c) => s + c._count._all, 0);
  const totalRevenue = Number(revenueAgg._sum.total ?? 0);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Vendas</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">Pedidos</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {totalAll} {totalAll === 1 ? "pedido" : "pedidos"} ·{" "}
            {pendingCount} aguardando ação · receita total{" "}
            {formatBRL(totalRevenue)}
          </p>
        </div>
      </header>

      {/* Tabs por status */}
      <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-line">
        {STATUS_TABS.map((t) => {
          const active =
            (t.value === "" && !status) || t.value === status;
          const count =
            t.value === "" ? totalAll : (countMap[t.value] ?? 0);
          return (
            <Link
              key={t.value || "all"}
              href={buildHref(sp, { status: t.value || undefined })}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-orange text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  active
                    ? "bg-orange-soft text-orange"
                    : "bg-line text-ink-soft"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Filtros */}
      <form action="/admin/pedidos" className="mt-5 flex flex-wrap gap-2.5">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar pedido, cliente, e-mail..."
          className="h-9 flex-1 min-w-[260px] rounded-md border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
        />
        <select
          name="canal"
          defaultValue={canal ?? ""}
          className="h-9 rounded-md border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none"
        >
          <option value="">Todos canais</option>
          {Object.entries(CHANNEL_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-ink px-4 text-[13px] font-medium text-bone transition-colors hover:bg-orange"
        >
          Aplicar
        </button>
      </form>

      <section className="mt-6">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
            <p className="display text-[24px]">Nenhum pedido aqui.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {status || q || canal
                ? "Ajuste os filtros pra ver mais."
                : "Quando o primeiro pedido entrar, aparece nessa lista."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/50">
                  {[
                    "Pedido",
                    "Cliente",
                    "Canal",
                    "Pagamento",
                    "Status",
                    "Total",
                    ""
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-b border-line px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => {
                  const itemCount = o.items.reduce(
                    (s, it) => s + it.quantity,
                    0
                  );
                  return (
                    <tr
                      key={o.id}
                      className={`group cursor-pointer hover:bg-sand/40 ${
                        i < orders.length - 1 ? "border-b border-line" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          <span className="font-mono text-[13px] font-medium text-ink">
                            #{o.number}
                          </span>
                          <span className="block text-[11px] text-ink-faint">
                            {o.createdAt.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          <span className="block text-[13px] font-medium text-ink">
                            {o.customer.name}
                          </span>
                          <span className="block text-[11px] text-ink-faint">
                            {o.customer.email}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          <ChannelChip channel={o.channel} />
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block text-[13px] text-ink-soft"
                        >
                          {PAYMENT_LABEL[o.paymentStatus]}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          <StatusPill status={o.status} />
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          <span className="font-serif text-[14px] font-medium text-ink">
                            {formatBRL(o.total.toNumber())}
                          </span>
                          <span className="block text-[11px] text-ink-faint">
                            {itemCount}{" "}
                            {itemCount === 1 ? "item" : "itens"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block text-ink-faint group-hover:text-ink"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
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

function ChannelChip({ channel }: { channel: OrderChannel }) {
  const initials: Record<OrderChannel, string> = {
    SITE: "SI",
    ML: "ML",
    SHOPEE: "SH",
    AMAZON: "AM",
    MAGALU: "MG",
    WHATSAPP: "WA"
  };
  return (
    <span className="inline-flex items-center gap-2 text-[13px]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sand font-mono text-[9px] font-bold text-ink">
        {initials[channel]}
      </span>
      {CHANNEL_LABEL[channel]}
    </span>
  );
}
