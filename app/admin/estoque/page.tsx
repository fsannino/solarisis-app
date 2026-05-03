import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

type SearchParams = {
  q?: string;
  filter?: "all" | "critical" | "out" | "ok";
};

const FILTERS: {
  value: NonNullable<SearchParams["filter"]>;
  label: string;
}[] = [
  { value: "all", label: "Todos" },
  { value: "critical", label: "Estoque crítico (<5)" },
  { value: "out", label: "Sem estoque" },
  { value: "ok", label: "Saudáveis (≥5)" }
];

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.q) params.set("q", merged.q);
  if (merged.filter && merged.filter !== "all")
    params.set("filter", merged.filter);
  const qs = params.toString();
  return qs ? `/admin/estoque?${qs}` : "/admin/estoque";
}

export default async function StockPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const filter = sp.filter ?? "all";

  const where: Prisma.ProductVariantWhereInput = {};
  if (filter === "critical") {
    where.stock = { gt: 0, lt: 5 };
  } else if (filter === "out") {
    where.stock = 0;
  } else if (filter === "ok") {
    where.stock = { gte: 5 };
  }
  if (q) {
    where.OR = [
      { sku: { contains: q, mode: "insensitive" } },
      { product: { name: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [variants, totals] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
      take: 200,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, alt: true }
            }
          }
        }
      }
    }),
    prisma.productVariant.findMany({
      select: { stock: true }
    })
  ]);

  const totalUnits = totals.reduce((s, v) => s + v.stock, 0);
  const outCount = totals.filter((v) => v.stock === 0).length;
  const lowCount = totals.filter((v) => v.stock > 0 && v.stock < 5).length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">Estoque</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {totalUnits.toLocaleString("pt-BR")} unidades · {outCount} sem
            estoque · {lowCount} críticas (&lt;5)
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <form action="/admin/estoque" className="flex flex-wrap gap-2.5">
          {filter !== "all" && (
            <input type="hidden" name="filter" value={filter} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome ou SKU..."
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
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Link
                key={f.value}
                href={buildHref(sp, { filter: f.value })}
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
        {variants.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
            <p className="display text-[24px]">Nenhuma variante aqui.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {q || filter !== "all"
                ? "Ajuste os filtros pra ver mais."
                : "Cadastre produtos com variantes pra começar."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/50">
                  {[
                    "Produto",
                    "Variante",
                    "SKU",
                    "Estoque",
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
                {variants.map((v, i) => {
                  const variantLabel = [v.color, v.size]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <tr
                      key={v.id}
                      className={`group cursor-pointer hover:bg-sand/40 ${
                        i < variants.length - 1 ? "border-b border-line" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/estoque/${v.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="relative h-12 w-9 shrink-0 overflow-hidden bg-sand">
                            {v.product.images[0] && (
                              <Image
                                src={v.product.images[0].url}
                                alt={
                                  v.product.images[0].alt ?? v.product.name
                                }
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="text-[13px] font-medium text-ink">
                            {v.product.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/estoque/${v.id}`}
                          className="block text-[13px] text-ink-soft"
                        >
                          {variantLabel || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/estoque/${v.id}`}
                          className="block font-mono text-[11px] text-ink-faint"
                        >
                          {v.sku}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/estoque/${v.id}`}
                          className="block font-serif text-[16px] font-medium text-ink"
                        >
                          {v.stock}{" "}
                          <span className="text-[11px] text-ink-faint">un</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/estoque/${v.id}`}
                          className="block"
                        >
                          <StockBadge stock={v.stock} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/estoque/${v.id}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange hover:underline"
                        >
                          Ajustar →
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

function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock === 0
      ? "bg-destructive/15 text-destructive"
      : stock < 5
        ? "bg-orange-soft text-orange"
        : "bg-green/20 text-green";
  const label = stock === 0 ? "Esgotado" : stock < 5 ? "Crítico" : "OK";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tone}`}
    >
      {label}
    </span>
  );
}
