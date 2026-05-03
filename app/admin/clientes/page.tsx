import Link from "next/link";
import { CustomerSegment, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  q?: string;
  seg?: string;
};

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  VIP: "VIP",
  REGULAR: "Regular",
  NEW: "Nova",
  AT_RISK: "Em risco",
  CHURNED: "Inativa"
};

const SEGMENT_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "VIP", label: "VIP" },
  { value: "REGULAR", label: "Recorrentes" },
  { value: "NEW", label: "Novas" },
  { value: "AT_RISK", label: "Em risco" },
  { value: "CHURNED", label: "Inativas" }
];

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.q) params.set("q", merged.q);
  if (merged.seg) params.set("seg", merged.seg);
  const qs = params.toString();
  return qs ? `/admin/clientes?${qs}` : "/admin/clientes";
}

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

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const seg = sp.seg;

  const where: Prisma.CustomerWhereInput = {};
  if (
    seg &&
    ["VIP", "REGULAR", "NEW", "AT_RISK", "CHURNED"].includes(seg)
  ) {
    where.segment = seg as CustomerSegment;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } }
    ];
  }

  const [customers, segmentCounts, ltvAgg, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
          select: { city: true, state: true }
        }
      }
    }),
    prisma.customer.groupBy({
      by: ["segment"],
      _count: { _all: true }
    }),
    prisma.customer.aggregate({
      _avg: { totalSpent: true },
      where: { ordersCount: { gt: 0 } }
    }),
    prisma.customer.count()
  ]);

  const segMap = Object.fromEntries(
    segmentCounts.map((s) => [s.segment, s._count._all])
  );
  const ltvAvg = Number(ltvAgg._avg.totalSpent ?? 0);
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">CRM</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">Clientes</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {total} {total === 1 ? "cliente" : "clientes"} ·{" "}
            {segMap.VIP ?? 0} VIP · LTV médio {formatBRL(ltvAvg)}
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          dot="orange"
          label="VIP"
          value={segMap.VIP ?? 0}
          hint="Top em LTV"
        />
        <KpiCard
          dot="green"
          label="Recorrentes"
          value={segMap.REGULAR ?? 0}
          hint="2+ pedidos"
        />
        <KpiCard
          dot="ink"
          label="Novas (30d)"
          value={segMap.NEW ?? 0}
          hint="Ainda não recompradas"
        />
        <KpiCard
          dot="faint"
          label="Em risco"
          value={(segMap.AT_RISK ?? 0) + (segMap.CHURNED ?? 0)}
          hint="90+ dias sem comprar"
        />
      </section>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <form action="/admin/clientes" className="flex flex-wrap gap-2.5">
          {seg && <input type="hidden" name="seg" value={seg} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar nome ou e-mail..."
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
          {SEGMENT_FILTERS.map((f) => {
            const active = (seg ?? "") === f.value;
            return (
              <Link
                key={f.label}
                href={buildHref(sp, { seg: f.value || undefined })}
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
        {customers.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
            <p className="display text-[24px]">Nenhum cliente aqui.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {q || seg
                ? "Ajuste os filtros pra ver mais."
                : "Os clientes aparecem aqui depois do primeiro login."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/50">
                  {[
                    "Cliente",
                    "Cidade",
                    "Desde",
                    "Pedidos",
                    "LTV",
                    "Último pedido",
                    "Segmento"
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
                {customers.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`group cursor-pointer hover:bg-sand/40 ${
                      i < customers.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-soft font-mono text-[11px] font-bold text-orange">
                          {initials(c.name)}
                        </span>
                        <span>
                          <span className="block text-[13px] font-medium text-ink">
                            {c.name}
                          </span>
                          <span className="block text-[11px] text-ink-faint">
                            {c.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block text-[13px] text-ink-soft"
                      >
                        {c.addresses[0]
                          ? `${c.addresses[0].city}/${c.addresses[0].state}`
                          : "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block text-[12px] text-ink-soft"
                      >
                        {fmtDate(c.createdAt)}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block text-[13px] text-ink"
                      >
                        {c.ordersCount}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block font-serif text-[13px] font-medium text-ink"
                      >
                        {formatBRL(c.totalSpent.toNumber())}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block text-[12px] text-ink-soft"
                      >
                        {fmtDate(c.lastOrderAt)}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="block"
                      >
                        <SegmentPill segment={c.segment} />
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

function KpiCard({
  dot,
  label,
  value,
  hint
}: {
  dot: "orange" | "green" | "ink" | "faint";
  label: string;
  value: number;
  hint: string;
}) {
  const dotClass = {
    orange: "bg-orange",
    green: "bg-green",
    ink: "bg-ink",
    faint: "bg-ink-faint"
  }[dot];
  return (
    <div className="border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      </div>
      <p className="display mt-2 text-[28px]">{value}</p>
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
