import Link from "next/link";
import {
  Prisma,
  PaymentStatus,
  PaymentMethod
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  status?: string;
  method?: string;
  q?: string;
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PAID", label: "Pagos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "AUTHORIZED", label: "Autorizados" },
  { value: "FAILED", label: "Falharam" },
  { value: "REFUNDED", label: "Reembolsados" },
  { value: "CANCELED", label: "Cancelados" }
];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
  CANCELED: "Cancelado"
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BOLETO: "Boleto"
};

const METHOD_INITIAL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CREDIT_CARD: "CC",
  DEBIT_CARD: "DC",
  BOLETO: "BO"
};

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "REFUNDED",
  "FAILED",
  "CANCELED"
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BOLETO"
];

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.status) params.set("status", merged.status);
  if (merged.method) params.set("method", merged.method);
  if (merged.q) params.set("q", merged.q);
  const qs = params.toString();
  return qs ? `/admin/pagamentos?${qs}` : "/admin/pagamentos";
}

export default async function PaymentsAdminPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status?.trim();
  const method = sp.method?.trim();
  const q = sp.q?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (status && PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    where.paymentStatus = status as PaymentStatus;
  }
  if (method && PAYMENT_METHODS.includes(method as PaymentMethod)) {
    where.paymentMethod = method as PaymentMethod;
  }
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { gatewayId: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [orders, statusCounts, paidAgg, pendingAgg, refundedAgg, failedCount] =
    await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          customer: { select: { name: true, email: true } }
        }
      }),
      prisma.order.groupBy({
        by: ["paymentStatus"],
        _count: { _all: true }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: { paymentStatus: "PAID" }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: { paymentStatus: "PENDING" }
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: { paymentStatus: "REFUNDED" }
      }),
      prisma.order.count({ where: { paymentStatus: "FAILED" } })
    ]);

  const countMap = Object.fromEntries(
    statusCounts.map((c) => [c.paymentStatus, c._count._all])
  );
  const totalAll = statusCounts.reduce((s, c) => s + c._count._all, 0);

  const paidTotal = Number(paidAgg._sum.total ?? 0);
  const pendingTotal = Number(pendingAgg._sum.total ?? 0);
  const refundedTotal = Number(refundedAgg._sum.total ?? 0);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Vendas</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
            Pagamentos
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {totalAll} {totalAll === 1 ? "transação" : "transações"} no total ·
            integração Mercado Pago
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Recebido"
          value={formatBRL(paidTotal)}
          hint={`${paidAgg._count._all} ${
            paidAgg._count._all === 1 ? "pago" : "pagos"
          }`}
          tone="positive"
        />
        <Kpi
          label="Aguardando"
          value={formatBRL(pendingTotal)}
          hint={`${pendingAgg._count._all} ${
            pendingAgg._count._all === 1 ? "pendente" : "pendentes"
          }`}
        />
        <Kpi
          label="Reembolsado"
          value={formatBRL(refundedTotal)}
          hint={`${refundedAgg._count._all} ${
            refundedAgg._count._all === 1 ? "transação" : "transações"
          }`}
        />
        <Kpi
          label="Falharam"
          value={String(failedCount)}
          hint="exigem revisão"
          tone={failedCount > 0 ? "negative" : "neutral"}
        />
      </section>

      {/* Tabs por status */}
      <nav className="mt-7 flex gap-6 overflow-x-auto border-b border-line">
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
      <form action="/admin/pagamentos" className="mt-5 flex flex-wrap gap-2.5">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar pedido, cliente, ID Mercado Pago..."
          className="h-9 flex-1 min-w-[260px] rounded-md border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
        />
        <select
          name="method"
          defaultValue={method ?? ""}
          className="h-9 rounded-md border border-line bg-surface px-3 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none"
        >
          <option value="">Todos métodos</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABEL[m]}
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
            <p className="display text-[24px]">Nenhuma transação aqui.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {status || q || method
                ? "Ajuste os filtros pra ver mais."
                : "Quando um pedido for pago, aparece nessa lista."}
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
                    "Método",
                    "Gateway",
                    "Status",
                    "Valor",
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
                  const dateLabel = (o.paidAt ?? o.createdAt).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    }
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
                            {dateLabel}
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
                          <MethodChip method={o.paymentMethod} />
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          {o.gatewayId ? (
                            <span className="font-mono text-[11px] text-ink-soft">
                              {o.gatewayId}
                            </span>
                          ) : (
                            <span className="text-[13px] text-ink-faint">—</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/pedidos/${o.number}`}
                          className="block"
                        >
                          <PaymentPill status={o.paymentStatus} />
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

function Kpi({
  label,
  value,
  hint,
  tone = "neutral"
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const accent =
    tone === "positive"
      ? "text-green"
      : tone === "negative"
        ? "text-destructive"
        : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
        {label}
      </p>
      <p className={`mt-2 font-serif text-[24px] font-medium ${accent}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}

function PaymentPill({ status }: { status: PaymentStatus }) {
  const tones: Record<PaymentStatus, string> = {
    PENDING: "bg-line text-ink-soft",
    AUTHORIZED: "bg-orange-soft text-orange",
    PAID: "bg-green/20 text-green",
    REFUNDED: "bg-line text-ink-faint",
    FAILED: "bg-destructive/15 text-destructive",
    CANCELED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function MethodChip({ method }: { method: PaymentMethod }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-ink">
      <span className="flex h-5 min-w-[28px] items-center justify-center rounded-full bg-sand px-1.5 font-mono text-[9px] font-bold text-ink">
        {METHOD_INITIAL[method]}
      </span>
      {METHOD_LABEL[method]}
    </span>
  );
}
