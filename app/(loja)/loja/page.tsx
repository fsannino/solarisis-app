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
      variants: { select: { stock: true } }
    }
  });

  const colecaoAtual = colecao
    ? await prisma.collection.findUnique({ where: { slug: colecao } })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-ink-soft">
          {colecaoAtual ? `Coleção ${colecaoAtual.name}` : "Loja"}
        </p>
        <h1 className="font-serif text-4xl italic text-ink md:text-5xl">
          {colecaoAtual?.name ??
            (categoria === "INFANTIL"
              ? "Infantil"
              : categoria === "ACESSORIO"
                ? "Acessórios"
                : categoria === "ADULTO"
                  ? "Adulto"
                  : "Catálogo completo")}
        </h1>
        {colecaoAtual?.description && (
          <p className="max-w-xl text-ink-soft">{colecaoAtual.description}</p>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-2">
          {FILTROS_CATEGORIA.map((f) => {
            const active =
              (f.value === "" && !categoria) || f.value === categoria;
            return (
              <Link
                key={f.value || "all"}
                href={buildHref(sp, { categoria: f.value || undefined })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  active
                    ? "border-orange bg-orange-soft text-ink"
                    : "border-line-strong text-ink-soft hover:border-orange hover:text-ink"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        <form action="/loja" className="flex gap-2">
          {categoria && (
            <input type="hidden" name="categoria" value={categoria} />
          )}
          {colecao && <input type="hidden" name="colecao" value={colecao} />}
          <select
            name="ordem"
            defaultValue={ordem}
            className="h-9 rounded-md border border-line-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
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
            className="h-9 w-40 rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-ink px-4 text-sm text-surface transition-colors hover:bg-ink-soft"
          >
            Aplicar
          </button>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="font-serif text-2xl italic text-ink">
            Nada por aqui ainda.
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Tente ajustar os filtros ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
          {products.map((p) => {
            const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
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
                  outOfStock: totalStock === 0
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
