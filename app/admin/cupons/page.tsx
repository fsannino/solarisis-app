import Link from "next/link";
import { CouponType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  q?: string;
  status?: string;
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "paused", label: "Pausados" },
  { value: "expired", label: "Expirados" }
];

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENT: "Porcentagem",
  FIXED: "Valor fixo",
  FREE_SHIPPING: "Frete grátis"
};

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.q) params.set("q", merged.q);
  if (merged.status) params.set("status", merged.status);
  const qs = params.toString();
  return qs ? `/admin/cupons?${qs}` : "/admin/cupons";
}

export default async function CouponsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = sp.status;

  const where: Prisma.CouponWhereInput = {};
  if (status && ["active", "paused", "expired"].includes(status)) {
    where.status = status;
  }
  if (q) {
    where.code = { contains: q, mode: "insensitive" };
  }

  const [coupons, totalActive, totalUses] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" }
    }),
    prisma.coupon.count({ where: { status: "active" } }),
    prisma.coupon.aggregate({ _sum: { usedCount: true } })
  ]);

  const totalUsesNum = Number(totalUses._sum.usedCount ?? 0);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Vendas</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">Cupons</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {coupons.length} {coupons.length === 1 ? "cupom" : "cupons"} ·{" "}
            {totalActive} ativos · {totalUsesNum} usos no total
          </p>
        </div>
        <Link
          href="/admin/cupons/novo"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo cupom
        </Link>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <form action="/admin/cupons" className="flex flex-wrap gap-2.5">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por código..."
            className="h-9 min-w-[260px] rounded-md border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-ink px-4 text-[13px] font-medium text-bone transition-colors hover:bg-orange"
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => {
            const active = (status ?? "") === f.value;
            return (
              <Link
                key={f.label}
                href={buildHref(sp, { status: f.value || undefined })}
                className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-ink bg-ink text-bone"
                    : "border-line text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="mt-6">
        {coupons.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
            <p className="display text-[24px]">Nenhum cupom ainda.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {q || status
                ? "Ajuste os filtros pra ver mais."
                : "Crie o primeiro pra começar a campanhar."}
            </p>
            <Link
              href="/admin/cupons/novo"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink"
            >
              Criar cupom
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/50">
                  {[
                    "Código",
                    "Tipo",
                    "Valor",
                    "Mínimo",
                    "Usos",
                    "Validade",
                    "Status",
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
                {coupons.map((c, i) => {
                  const valueLabel =
                    c.type === "PERCENT"
                      ? `${c.value.toString().replace(/\.00$/, "")}%`
                      : c.type === "FIXED"
                        ? formatBRL(c.value.toNumber())
                        : "—";
                  const usesLabel = c.maxUses
                    ? `${c.usedCount} / ${c.maxUses}`
                    : `${c.usedCount}`;
                  const validityLabel = c.validUntil
                    ? `até ${c.validUntil.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}`
                    : "sem prazo";
                  return (
                    <tr
                      key={c.id}
                      className={`group cursor-pointer hover:bg-sand/40 ${
                        i < coupons.length - 1 ? "border-b border-line" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-orange"
                        >
                          {c.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block text-[13px] text-ink-soft"
                        >
                          {TYPE_LABEL[c.type]}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block font-serif text-[14px] font-medium text-ink"
                        >
                          {valueLabel}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block text-[12px] text-ink-soft"
                        >
                          {c.minOrderValue
                            ? formatBRL(c.minOrderValue.toNumber())
                            : "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block font-mono text-[12px] text-ink"
                        >
                          {usesLabel}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block text-[12px] text-ink-soft"
                        >
                          {validityLabel}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/cupons/${c.id}`}
                          className="block"
                        >
                          <StatusPill status={c.status} />
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/cupons/${c.id}`}
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

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    active: "bg-green/20 text-green",
    paused: "bg-line text-ink-soft",
    expired: "bg-line text-ink-faint"
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    paused: "Pausado",
    expired: "Expirado"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status] ?? "bg-line text-ink-soft"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
