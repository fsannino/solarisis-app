import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import { archiveProduct, updateProduct } from "../_actions";
import { ProductForm } from "../_form";
import { VariantsSection } from "./_variants-section";

type PageProps = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  DRAFT: "Rascunho",
  ARCHIVED: "Arquivado"
};

const CATEGORY_LABEL: Record<string, string> = {
  ADULTO: "Adulto",
  INFANTIL: "Mini",
  ACESSORIO: "Acessório"
};

export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      category: true,
      gender: true,
      type: true,
      fps: true,
      basePrice: true,
      salePrice: true,
      costPrice: true,
      status: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        select: { url: true, alt: true, isPrimary: true }
      },
      variants: { select: { stock: true } }
    }
  });

  if (!product) {
    notFound();
  }

  const update = updateProduct.bind(null, product.id);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const variantCount = product.variants.length;

  async function handleArchive() {
    "use server";
    await archiveProduct(product!.id);
  }

  return (
    <div>
      {/* Header editorial */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Produtos
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="display text-[clamp(28px,3vw,36px)]">
              {product.name}
            </h1>
            <StatusPill status={product.status} />
          </div>
          <p className="font-mono text-[11px] text-ink-soft">
            {product.sku} · {CATEGORY_LABEL[product.category]} ·{" "}
            <span className={totalStock === 0 ? "text-destructive" : ""}>
              {totalStock} em estoque
            </span>{" "}
            · {variantCount}{" "}
            {variantCount === 1 ? "variante" : "variantes"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/produtos/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[12px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Ver na loja
          </Link>
          {product.status !== "ARCHIVED" && (
            <form action={handleArchive}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                Arquivar
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="mt-8">
        <ProductForm
          action={update}
          submitLabel="Salvar alterações"
          defaultValues={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.description,
            category: product.category,
            gender: product.gender,
            type: product.type,
            fps: product.fps,
            basePrice: String(product.basePrice),
            salePrice: product.salePrice != null ? String(product.salePrice) : "",
            costPrice: product.costPrice != null ? String(product.costPrice) : "",
            status: product.status,
            images: product.images
          }}
        />
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <VariantsSection productId={product.id} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    ACTIVE: "bg-green/20 text-green",
    DRAFT: "bg-line text-ink-soft",
    ARCHIVED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status] ?? ""}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
