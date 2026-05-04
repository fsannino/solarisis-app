import Link from "next/link";
import { Prisma, ReturnStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  status?: string;
  q?: string;
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "REQUESTED", label: "Solicitadas" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "RECEIVED", label: "Recebidas" },
  { value: "REFUNDED", label: "Reembolsadas" },
  { value: "REJECTED", label: "Recusadas" }
];

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprovada",
  RECEIVED: "Recebida",
  REFUNDED: "Reembolsada",
  REJECTED: "Recusada"
};

const STATUSES: ReturnStatus[] = [
  "REQUESTED",
  "APPROVED",
  "RECEIVED",
  "REFUNDED",
  "REJECTED"
];

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.status) params.set("status", merged.status);
  if (merged.q) params.set("q", merged.q);
  const qs = params.toString();
  return qs ? `/admin/devolucoes?${qs}` : "/admin/devolucoes";
}

export default async function ReturnsAdminPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status?.trim();
  const q = sp.q?.trim();

  const where: Prisma.ReturnWhereInput = {};
  if (status && STATUSES.includes(status as ReturnStatus)) {
    where.status = status as ReturnStatus;
  }
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { order: { number: { contains: q, mode: "insensitive" } } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [returns, counts, refundedAgg, openCount] = await Promise.all([
    prisma.return.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: { select: { number: true, total: true } },
        customer: { select: { name: true, email: true } }
      }
    }),
    prisma.return.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.return.aggregate({
      _sum: { refundAmount: true },
      where: { status: "REFUNDED" }
    }),
    prisma.return.count({
      where: { status: { in: ["REQUESTED", "APPROVED", "RECEIVED"] } }
    })
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  );
  const totalAll = counts.reduce((s, c) => s + c._count._all, 0);
  const totalRefunded = Number(refundedAgg._sum.refundAmount ?? 0);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Vendas</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
            Devoluções
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {totalAll} {totalAll === 1 ? "devolução" : "devoluções"} ·{" "}
            {openCount} em aberto · {formatBRL(totalRefunded)} reembolsados
          </p>
        </div>
        <Link
          href="/admin/devolucoes/novo"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova devolução
        </Link>
      </header>

      {/* Tabs */}
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

      {/* Busca */}
      <form action="/admin/devolucoes" className="mt-5 flex flex-wrap gap-2.5">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por RMA, pedido, cliente..."
          className="h-9 flex-1 min-w-[260px] rounded-md border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-ink px-4 text-[13px] font-medium text-bone transition-colors hover:bg-orange"
        >
          Aplicar
        </button>
      </form>

      <section className="mt-6">
        {returns.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
            <p className="display text-[24px]">Nenhuma devolução aqui.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {status || q
                ? "Ajuste os filtros pra ver mais."
                : "Quando uma devolução for registrada, aparece nessa lista."}
            </p>
            <Link
              href="/admin/devolucoes/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink"
            >
              Registrar devolução
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/50">
                  {[
                    "RMA",
                    "Pedido",
                    "Cliente",
                    "Motivo",
                    "Status",
                    "Reembolso",
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
                {returns.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`group cursor-pointer hover:bg-sand/40 ${
                      i < returns.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/devolucoes/${r.number}`}
                        className="block"
                      >
                        <span className="font-mono text-[13px] font-medium text-ink">
                          {r.number}
                        </span>
                        <span className="block text-[11px] text-ink-faint">
                          {r.createdAt.toLocaleDateString("pt-BR", {
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
                        href={`/admin/devolucoes/${r.number}`}
                        className="block"
                      >
                        <span className="font-mono text-[12px] text-ink-soft">
                          #{r.order.number}
                        </span>
                        <span className="block text-[11px] text-ink-faint">
                          total {formatBRL(r.order.total.toNumber())}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/devolucoes/${r.number}`}
                        className="block"
                      >
                        <span className="block text-[13px] font-medium text-ink">
                          {r.customer.name}
                        </span>
                        <span className="block text-[11px] text-ink-faint">
                          {r.customer.email}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/devolucoes/${r.number}`}
                        className="block max-w-[200px] truncate text-[13px] text-ink-soft"
                      >
                        {r.reason}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/devolucoes/${r.number}`}
                        className="block"
                      >
                        <StatusPill status={r.status} />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/devolucoes/${r.number}`}
                        className="block"
                      >
                        {r.refundAmount ? (
                          <span className="font-serif text-[14px] font-medium text-ink">
                            {formatBRL(r.refundAmount.toNumber())}
                          </span>
                        ) : (
                          <span className="text-[13px] text-ink-faint">—</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/devolucoes/${r.number}`}
                        className="block text-ink-faint group-hover:text-ink"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnStatus }) {
  const tones: Record<ReturnStatus, string> = {
    REQUESTED: "bg-orange-soft text-orange",
    APPROVED: "bg-orange-soft text-orange",
    RECEIVED: "bg-orange-soft text-orange",
    REFUNDED: "bg-green/20 text-green",
    REJECTED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
