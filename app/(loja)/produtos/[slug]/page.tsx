import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/loja/product-gallery";
import { VariantSelector } from "@/components/loja/variant-selector";

const CATEGORY_LABEL: Record<string, string> = {
  ADULTO: "Adulto",
  INFANTIL: "Infantil",
  ACESSORIO: "Acessório"
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, seoTitle: true, seoDescription: true, description: true }
  });
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.seoTitle ?? `${product.name} — Solarisis`,
    description: product.seoDescription ?? product.description.slice(0, 160)
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] }
    }
  });

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    color: v.color,
    size: v.size,
    stock: v.stock,
    priceOverride: v.priceOverride?.toNumber() ?? null
  }));

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
      <nav className="eyebrow mb-8 flex flex-wrap items-center gap-2 text-[10px]">
        <Link href="/" className="hover:text-orange">
          Início
        </Link>
        <span>/</span>
        <Link href="/loja" className="hover:text-orange">
          Loja
        </Link>
        <span>/</span>
        <Link
          href={`/loja?categoria=${product.category}`}
          className="hover:text-orange"
        >
          {CATEGORY_LABEL[product.category] ?? product.category}
        </Link>
        <span>/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
        <ProductGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          productName={product.name}
        />

        <div className="flex flex-col gap-8">
          <div>
            <p className="eyebrow">{product.type}</p>
            <h1 className="display mt-3 text-[clamp(36px,4.5vw,64px)] text-ink">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-orange-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-orange">
                FPU {product.fps}+
              </span>
              {product.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line-strong px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft"
                >
                  {t}
                </span>
              ))}
              {totalStock === 0 && (
                <span className="rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-bone">
                  Esgotado
                </span>
              )}
            </div>
          </div>

          <p className="text-[16px] leading-[1.6] text-ink-soft">
            {product.description}
          </p>

          <VariantSelector
            variants={variantOptions}
            basePrice={product.basePrice.toNumber()}
            salePrice={product.salePrice?.toNumber() ?? null}
          />

          {product.materials.length > 0 && (
            <div className="border-t border-line pt-7">
              <p className="eyebrow text-[10px]">Composição</p>
              <p className="mt-2 text-[15px] text-ink">
                {product.materials.join(" · ")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 border-t border-line pt-7 text-[14px]">
            <div>
              <p className="eyebrow text-[10px]">Frete</p>
              <p className="mt-1.5 text-ink">Grátis · R$ 399+</p>
            </div>
            <div>
              <p className="eyebrow text-[10px]">Trocas</p>
              <p className="mt-1.5 text-ink">Até 30 dias</p>
            </div>
            <div>
              <p className="eyebrow text-[10px]">Pagamento</p>
              <p className="mt-1.5 text-ink">Em até 6x</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
