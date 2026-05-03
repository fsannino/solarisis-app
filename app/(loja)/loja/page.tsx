import Link from "next/link";
import { Prisma, ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/loja/product-card";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string;
  linha?: "adulto" | "mini";
  tipo?: string; // pode ser CSV: "biquini,maio"
  cor?: string;
  tamanho?: string;
  ordem?: "destaque" | "menor-preco" | "maior-preco";
  colecao?: string;
};

const COLOR_SWATCH: Record<string, string> = {
  laranja: "#FF7A00",
  verde: "#6FBF4A",
  areia: "#F5E9DA",
  branco: "#FAF7F2",
  preto: "#1A1614",
  marinho: "#1F3661",
  rosa: "#FF8DA1",
  pink: "#FF1F7A",
  coral: "#FF6B47",
  "off-white": "#F5F2EC",
  "verde-musgo": "#7A8C5A",
  azul: "#5DC1B5",
  natural: "#D4C7B0",
  terracota: "#C76B4A"
};

function swatchColor(name: string) {
  const key = name.toLowerCase().trim();
  if (COLOR_SWATCH[key]) return COLOR_SWATCH[key];
  // fallback genérico
  return "#D4C7B0";
}

function csvToArray(s?: string) {
  return s ? s.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

function arrayToCsv(arr: string[]) {
  return arr.join(",");
}

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.q) params.set("q", merged.q);
  if (merged.linha && merged.linha !== "adulto") params.set("linha", merged.linha);
  if (merged.tipo) params.set("tipo", merged.tipo);
  if (merged.cor) params.set("cor", merged.cor);
  if (merged.tamanho) params.set("tamanho", merged.tamanho);
  if (merged.ordem && merged.ordem !== "destaque") params.set("ordem", merged.ordem);
  if (merged.colecao) params.set("colecao", merged.colecao);
  const qs = params.toString();
  return qs ? `/loja?${qs}` : "/loja";
}

function toggleInCsv(current: string | undefined, value: string) {
  const arr = csvToArray(current);
  return arrayToCsv(
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
  );
}

export default async function CatalogoPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const linha = sp.linha === "mini" ? "mini" : "adulto";
  const q = sp.q?.trim();
  const tipos = csvToArray(sp.tipo);
  const cor = sp.cor?.trim();
  const tamanho = sp.tamanho?.trim();
  const ordem = sp.ordem ?? "destaque";
  const colecao = sp.colecao;

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  // Linha = ADULTO ou ACESSORIO (qualquer não-INFANTIL) vs INFANTIL
  if (linha === "mini") {
    where.category = ProductCategory.INFANTIL;
  } else {
    where.category = { not: ProductCategory.INFANTIL };
  }
  if (tipos.length > 0) {
    where.type = { in: tipos };
  }
  if (cor) {
    where.variants = { some: { color: { equals: cor, mode: "insensitive" } } };
  }
  if (tamanho) {
    where.variants = {
      ...(where.variants ?? {}),
      some: {
        ...((where.variants as Prisma.ProductVariantListRelationFilter)?.some ?? {}),
        size: tamanho
      }
    };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } }
    ];
  }
  if (colecao) {
    where.collections = { some: { collection: { slug: colecao } } };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    ordem === "menor-preco"
      ? { basePrice: "asc" }
      : ordem === "maior-preco"
        ? { basePrice: "desc" }
        : { createdAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true, color: true } }
    }
  });

  // Agregações pros filtros — baseadas na linha selecionada
  const linhaFilter =
    linha === "mini"
      ? { category: ProductCategory.INFANTIL }
      : { category: { not: ProductCategory.INFANTIL } };

  const [tiposAgg, coresAgg, tamanhosAgg, colecaoAtual] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", ...linhaFilter },
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" }
    }),
    prisma.productVariant.findMany({
      where: {
        product: { status: "ACTIVE", ...linhaFilter },
        color: { not: null }
      },
      select: { color: true },
      distinct: ["color"]
    }),
    prisma.productVariant.findMany({
      where: {
        product: { status: "ACTIVE", ...linhaFilter },
        size: { not: null }
      },
      select: { size: true },
      distinct: ["size"]
    }),
    colecao
      ? prisma.collection.findUnique({ where: { slug: colecao } })
      : null
  ]);

  const tiposDisponiveis = tiposAgg.map((t) => t.type);
  const coresDisponiveis = coresAgg
    .map((c) => c.color)
    .filter((c): c is string => Boolean(c))
    .sort();
  const tamanhosDisponiveis = tamanhosAgg
    .map((t) => t.size)
    .filter((t): t is string => Boolean(t))
    .sort((a, b) => {
      const order = ["PP", "P", "M", "G", "GG", "Único"];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      return a.localeCompare(b, "pt-BR");
    });

  const hasActiveFilters = tipos.length > 0 || !!cor || !!tamanho;

  const titleText = colecaoAtual?.name
    ? `${colecaoAtual.name}.`
    : linha === "mini"
      ? "Mini."
      : "Adulto.";

  return (
    <main className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8 md:pt-16">
      {/* Page header */}
      <header className="border-b border-line pb-8">
        <p className="eyebrow mb-4">
          {colecaoAtual ? "Coleção" : "Loja"} · Verão 26
        </p>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h1 className="display text-[clamp(48px,8vw,88px)]">
            {titleText}{" "}
            <em className="not-italic italic text-orange">Toda</em> a coleção.
          </h1>

          {/* Toggle Adulto / Mini (escondido em coleção específica) */}
          {!colecaoAtual && (
            <div className="inline-flex rounded-full border border-line-strong p-1">
              {[
                { id: "adulto", label: "Adulto" },
                { id: "mini", label: "Mini" }
              ].map((o) => {
                const active = linha === o.id;
                return (
                  <Link
                    key={o.id}
                    href={buildHref(
                      {},
                      { linha: o.id as "adulto" | "mini", colecao }
                    )}
                    className={cn(
                      "rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-ink text-bone"
                        : "text-ink hover:text-orange"
                    )}
                  >
                    {o.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-12 pt-9 md:grid-cols-[240px_1fr] md:gap-12">
        {/* Sidebar de filtros */}
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="eyebrow mb-4">Filtrar</p>

          <FilterGroup title="Categoria">
            <ul className="flex flex-col gap-2.5">
              {tiposDisponiveis.map((t) => {
                const active = tipos.includes(t);
                const next = toggleInCsv(sp.tipo, t);
                return (
                  <li key={t}>
                    <Link
                      href={buildHref(sp, { tipo: next || undefined })}
                      className="flex items-center gap-2.5 text-[14px] text-ink"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                          active
                            ? "border-orange bg-orange text-white"
                            : "border-line-strong bg-transparent"
                        )}
                      >
                        {active && (
                          <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 8l3.5 3.5L13 5" />
                          </svg>
                        )}
                      </span>
                      <span className="capitalize">{t}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </FilterGroup>

          {coresDisponiveis.length > 0 && (
            <FilterGroup title="Cor">
              <div className="flex flex-wrap gap-2">
                {coresDisponiveis.map((c) => {
                  const active = cor?.toLowerCase() === c.toLowerCase();
                  return (
                    <Link
                      key={c}
                      href={buildHref(sp, { cor: active ? undefined : c })}
                      title={c}
                      aria-label={c}
                      className={cn(
                        "h-[30px] w-[30px] shrink-0 rounded-full border transition-all",
                        active
                          ? "border-2 border-ink ring-2 ring-orange ring-offset-2 ring-offset-bone"
                          : "border-line-strong hover:border-ink"
                      )}
                      style={{ background: swatchColor(c) }}
                    />
                  );
                })}
              </div>
            </FilterGroup>
          )}

          {tamanhosDisponiveis.length > 0 && (
            <FilterGroup title="Tamanho">
              <div className="flex flex-wrap gap-1.5">
                {tamanhosDisponiveis.map((s) => {
                  const active = tamanho === s;
                  return (
                    <Link
                      key={s}
                      href={buildHref(sp, { tamanho: active ? undefined : s })}
                      className={cn(
                        "min-w-[34px] border px-3 py-1.5 text-center text-[12px] font-semibold transition-colors",
                        active
                          ? "border-ink bg-ink text-bone"
                          : "border-line-strong text-ink hover:border-ink"
                      )}
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
            </FilterGroup>
          )}

          <FilterGroup title="Proteção">
            <ul className="flex flex-col gap-2 text-[14px]">
              <li className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-orange bg-orange text-white"
                >
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                </span>
                FPU 50+
              </li>
              <li className="flex items-center gap-2.5 text-ink-faint">
                <span className="h-4 w-4 shrink-0 rounded-sm border border-line-strong" />
                FPU 30+
              </li>
            </ul>
          </FilterGroup>

          {hasActiveFilters && (
            <Link
              href={buildHref(
                {},
                { linha: linha as "adulto" | "mini", colecao }
              )}
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-orange"
            >
              Limpar filtros ↺
            </Link>
          )}
        </aside>

        {/* Resultados */}
        <div>
          <div className="mb-7 flex items-center justify-between">
            <p className="eyebrow">{products.length} peças</p>
            <form action="/loja" className="flex items-center gap-2">
              {linha !== "adulto" && <input type="hidden" name="linha" value={linha} />}
              {sp.tipo && <input type="hidden" name="tipo" value={sp.tipo} />}
              {cor && <input type="hidden" name="cor" value={cor} />}
              {tamanho && <input type="hidden" name="tamanho" value={tamanho} />}
              {colecao && <input type="hidden" name="colecao" value={colecao} />}
              <select
                name="ordem"
                defaultValue={ordem}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="rounded-full border border-line-strong bg-transparent px-4 py-2 text-[13px] font-medium text-ink focus-visible:border-ink focus-visible:outline-none"
              >
                <option value="destaque">Em destaque</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
              </select>
              <noscript>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-bone"
                >
                  Aplicar
                </button>
              </noscript>
            </form>
          </div>

          {products.length === 0 ? (
            <div className="border border-line p-20 text-center text-[14px] text-ink-soft">
              Nenhum item com esses filtros. Tente ampliar.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-7 gap-y-14 md:grid-cols-3">
              {products.map((p) => {
                const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                const colorCount = new Set(
                  p.variants.map((v) => v.color).filter(Boolean)
                ).size;
                return (
                  <ProductCard
                    key={p.id}
                    product={{
                      slug: p.slug,
                      name: p.name,
                      type: p.type,
                      fps: p.fps,
                      basePrice: p.basePrice.toNumber(),
                      salePrice: p.salePrice?.toNumber() ?? null,
                      imageUrl: p.images[0]?.url,
                      imageAlt: p.images[0]?.alt ?? p.name,
                      outOfStock: totalStock === 0,
                      colorCount,
                      tag: p.tags[0] ?? null
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FilterGroup({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open
      className="group border-t border-line py-4 [&[open]>summary>span:last-child]:rotate-45"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold uppercase tracking-[0.04em]">
        <span>{title}</span>
        <span aria-hidden className="text-ink-soft transition-transform">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
