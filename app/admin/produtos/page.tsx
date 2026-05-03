import Link from "next/link";
import Image from "next/image";
import { Prisma, ProductCategory, ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

type SearchParams = {
  q?: string;
  linha?: "adulto" | "mini" | "acessorio";
  status?: string;
  view?: "grid" | "list";
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado"
};

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  ADULTO: "Adulto",
  INFANTIL: "Mini",
  ACESSORIO: "Acessório"
};

function buildHref(sp: SearchParams, override: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...sp, ...override };
  if (merged.q) params.set("q", merged.q);
  if (merged.linha) params.set("linha", merged.linha);
  if (merged.status) params.set("status", merged.status);
  if (merged.view && merged.view !== "grid") params.set("view", merged.view);
  const qs = params.toString();
  return qs ? `/admin/produtos?${qs}` : "/admin/produtos";
}

export default async function ProductsListPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const linha = sp.linha;
  const status = sp.status;
  const view = sp.view ?? "grid";

  const where: Prisma.ProductWhereInput = {};
  if (linha === "mini") where.category = ProductCategory.INFANTIL;
  else if (linha === "acessorio") where.category = ProductCategory.ACESSORIO;
  else if (linha === "adulto") where.category = ProductCategory.ADULTO;
  if (status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
    where.status = status as ProductStatus;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } }
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      type: true,
      basePrice: true,
      salePrice: true,
      status: true,
      category: true,
      tags: true,
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true } }
    }
  });

  // Stats pra subtitle
  const allVariants = await prisma.productVariant.findMany({
    select: { stock: true }
  });
  const lowStockCount = allVariants.filter(
    (v) => v.stock > 0 && v.stock < 5
  ).length;
  const outOfStockCount = allVariants.filter((v) => v.stock === 0).length;
  const totalProducts = await prisma.product.count();

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">Produtos</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {totalProducts} {totalProducts === 1 ? "produto" : "produtos"} no
            catálogo
            {lowStockCount > 0 &&
              ` · ${lowStockCount} ${lowStockCount === 1 ? "variante" : "variantes"} com estoque crítico`}
            {outOfStockCount > 0 &&
              ` · ${outOfStockCount} sem estoque`}
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo produto
        </Link>
      </header>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <form action="/admin/produtos" className="flex flex-wrap gap-2.5">
          {linha && <input type="hidden" name="linha" value={linha} />}
          {status && <input type="hidden" name="status" value={status} />}
          {view !== "grid" && <input type="hidden" name="view" value={view} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar nome ou SKU..."
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
          {[
            { value: undefined, label: "Todas" },
            { value: "adulto" as const, label: "Adulto" },
            { value: "mini" as const, label: "Mini" },
            { value: "acessorio" as const, label: "Acessórios" }
          ].map((f) => {
            const active = (linha ?? undefined) === f.value;
            return (
              <Link
                key={f.label}
                href={buildHref(sp, { linha: f.value })}
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

        <div className="flex flex-wrap gap-1">
          {[
            { value: undefined, label: "Status" },
            { value: "ACTIVE", label: "Ativos" },
            { value: "DRAFT", label: "Rascunhos" },
            { value: "ARCHIVED", label: "Arquivados" }
          ].map((f) => {
            const active = status === f.value;
            return (
              <Link
                key={f.label}
                href={buildHref(sp, { status: f.value })}
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

        <div className="ml-auto flex overflow-hidden rounded-md border border-line">
          {(["grid", "list"] as const).map((v) => (
            <Link
              key={v}
              href={buildHref(sp, { view: v })}
              className={`flex h-9 w-9 items-center justify-center transition-colors ${
                view === v
                  ? "bg-ink text-bone"
                  : "bg-surface text-ink-soft hover:text-ink"
              }`}
              aria-label={v === "grid" ? "Grade" : "Lista"}
            >
              {v === "grid" ? <GridIcon /> : <ListIcon />}
            </Link>
          ))}
        </div>
      </div>

      <section className="mt-6">
        {products.length === 0 ? (
          <EmptyState />
        ) : view === "list" ? (
          <ProductsTable products={products} />
        ) : (
          <ProductsGrid products={products} />
        )}
      </section>
    </div>
  );
}

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  type: string;
  basePrice: Prisma.Decimal;
  salePrice: Prisma.Decimal | null;
  status: ProductStatus;
  category: ProductCategory;
  tags: string[];
  images: { url: string; alt: string | null }[];
  variants: { stock: number }[];
};

function ProductsGrid({ products }: { products: ProductRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const stock = p.variants.reduce((s, v) => s + v.stock, 0);
        const tag = p.tags[0];
        return (
          <Link
            key={p.id}
            href={`/admin/produtos/${p.id}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-sand">
              {p.images[0] && (
                <Image
                  src={p.images[0].url}
                  alt={p.images[0].alt ?? p.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform group-hover:scale-[1.02]"
                />
              )}
              <div className="absolute left-2.5 top-2.5">
                <StatusPill status={p.status} />
              </div>
              {tag && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-bone">
                  {tag}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 p-3.5">
              <p className="font-mono text-[10px] text-ink-faint">{p.sku}</p>
              <p className="truncate font-medium text-[13px] text-ink">
                {p.name}
              </p>
              <div className="flex items-center justify-between">
                <p className="font-serif text-[15px] font-medium text-ink">
                  {p.salePrice ? (
                    <>
                      <span className="mr-1 text-[11px] text-ink-faint line-through">
                        {formatBRL(p.basePrice.toNumber())}
                      </span>
                      <span className="text-orange">
                        {formatBRL(p.salePrice.toNumber())}
                      </span>
                    </>
                  ) : (
                    formatBRL(p.basePrice.toNumber())
                  )}
                </p>
                <StockBadge stock={stock} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ProductsTable({ products }: { products: ProductRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-sand/50">
            {[
              "Produto",
              "SKU",
              "Categoria",
              "Tipo",
              "Preço",
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
          {products.map((p, i) => {
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <tr
                key={p.id}
                className={`group cursor-pointer hover:bg-sand/40 ${
                  i < products.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden bg-sand">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].url}
                          alt={p.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-ink">
                      {p.name}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="block">
                    <span className="font-mono text-[11px] text-ink-faint">
                      {p.sku}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="block">
                    <span className="text-[13px] text-ink-soft">
                      {CATEGORY_LABEL[p.category]}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="block">
                    <span className="text-[13px] text-ink-soft capitalize">
                      {p.type}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="block">
                    <span className="font-serif text-[13px] font-medium text-ink">
                      {p.salePrice
                        ? formatBRL(p.salePrice.toNumber())
                        : formatBRL(p.basePrice.toNumber())}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="block">
                    <StockBadge stock={stock} />
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="block">
                    <StatusPill status={p.status} />
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/produtos/${p.id}`}
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
  );
}

function StatusPill({ status }: { status: ProductStatus }) {
  const tones: Record<ProductStatus, string> = {
    ACTIVE: "bg-green/20 text-green",
    DRAFT: "bg-line text-ink-soft",
    ARCHIVED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock === 0
      ? "bg-destructive/15 text-destructive"
      : stock < 5
        ? "bg-orange-soft text-orange"
        : "bg-line text-ink-soft";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${tone}`}
    >
      {stock} un
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-line bg-surface px-8 py-16 text-center">
      <p className="display text-[24px]">Nenhum produto ainda.</p>
      <p className="mt-2 text-[13px] text-ink-soft">
        Comece cadastrando o primeiro SKU do catálogo.
      </p>
      <Link
        href="/admin/produtos/novo"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink"
      >
        Cadastrar produto
      </Link>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
