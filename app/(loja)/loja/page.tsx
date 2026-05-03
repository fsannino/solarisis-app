import Link from "next/link";
import { Prisma, ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/loja/product-card";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string;
  categoria?: string;
  colecao?: string;
  ordem?: "recente" | "menor-preco" | "maior-preco";
};

const FILTROS_CATEGORIA: { value: string; label: string }[] = [
  { value: "", label: "Tudo" },
  { value: "ADULTO", label: "Adulto" },
  { value: "INFANTIL", label: "Infantil" },
  { value: "ACESSORIO", label: "Acessórios" }
];

const ORDEM: { value: NonNullable<SearchParams["ordem"]>; label: string }[] = [
  { value: "recente", label: "Mais recente" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" }
];

function buildHref(params: SearchParams, override: Partial<SearchParams>) {
  const sp = new URLSearchParams();
  const merged = { ...params, ...override };
  if (merged.q) sp.set("q", merged.q);
  if (merged.categoria) sp.set("categoria", merged.categoria);
  if (merged.colecao) sp.set("colecao", merged.colecao);
  if (merged.ordem && merged.ordem !== "recente") sp.set("ordem", merged.ordem);
  const qs = sp.toString();
  return qs ? `/loja?${qs}` : "/loja";
}

export default async function CatalogoPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categoria = sp.categoria;
  const colecao = sp.colecao;
  const ordem = sp.ordem ?? "recente";

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (categoria && ["ADULTO", "INFANTIL", "ACESSORIO"].includes(categoria)) {
    where.category = categoria as ProductCategory;
  }
  if (colecao) {
    where.collections = { some: { collection: { slug: colecao } } };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } }
    ];
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

  const colecaoAtual = colecao
    ? await prisma.collection.findUnique({ where: { slug: colecao } })
    : null;

  const eyebrowLabel = colecaoAtual
    ? `Coleção ${colecaoAtual.name}`
    : "Loja";
  const titleText =
    colecaoAtual?.name ??
    (categoria === "INFANTIL"
      ? "Mini"
      : categoria === "ACESSORIO"
        ? "Acessórios"
        : categoria === "ADULTO"
          ? "Adulto"
          : "Catálogo completo");

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
      <header className="mb-12 flex flex-col gap-3">
        <p className="eyebrow">{eyebrowLabel}</p>
        <h1 className="display text-[clamp(40px,5.5vw,72px)]">
          {titleText}
        </h1>
        {colecaoAtual?.description && (
          <p className="max-w-[640px] text-[16px] leading-[1.55] text-ink-soft">
            {colecaoAtual.description}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-4 border-y border-line py-5 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-2">
          {FILTROS_CATEGORIA.map((f) => {
            const active =
              (f.value === "" && !categoria) || f.value === categoria;
            return (
              <Link
                key={f.value || "all"}
                href={buildHref(sp, { categoria: f.value || undefined })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  active
                    ? "border-ink bg-ink text-bone"
                    : "border-line-strong text-ink-soft hover:-translate-y-0.5 hover:border-ink hover:text-ink"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        <form action="/loja" className="flex flex-wrap gap-2">
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          {colecao && <input type="hidden" name="colecao" value={colecao} />}
          <select
            name="ordem"
            defaultValue={ordem}
            className="h-10 rounded-full border border-line-strong bg-transparent px-4 text-sm text-ink focus-visible:border-ink focus-visible:outline-none"
          >
            {ORDEM.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar"
            className="h-10 w-44 rounded-full border border-line-strong bg-transparent px-4 text-sm text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
          >
            Aplicar
          </button>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="display text-[32px]">Nada por aqui ainda.</p>
          <p className="mt-3 text-[14px] text-ink-soft">
            Tente ajustar os filtros ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
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
  );
}
