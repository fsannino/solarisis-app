import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/loja/product-gallery";
import { VariantSelector } from "@/components/loja/variant-selector";
import { Badge } from "@/components/ui/badge";

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
    description:
      product.seoDescription ?? product.description.slice(0, 160)
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-16">
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-faint">
        <Link href="/" className="hover:text-ink">Início</Link>
        <span>/</span>
        <Link href="/loja" className="hover:text-ink">Loja</Link>
        <span>/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <ProductGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          productName={product.name}
        />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft">
              {product.type}
            </p>
            <h1 className="mt-2 font-serif text-4xl italic leading-tight text-ink md:text-5xl">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="soft">FPS {product.fps}+</Badge>
              {product.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-ink-soft">{product.description}</p>

          <VariantSelector
            variants={variantOptions}
            basePrice={product.basePrice.toNumber()}
            salePrice={product.salePrice?.toNumber() ?? null}
          />

          {product.materials.length > 0 && (
            <div className="border-t border-line pt-6">
              <p className="text-xs uppercase tracking-widest text-ink-soft">
                Composição
              </p>
              <p className="mt-2 text-sm text-ink">
                {product.materials.join(" · ")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-soft">
                Frete
              </p>
              <p className="mt-1 text-ink">
                Grátis acima de R$ 299
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-soft">
                Trocas
              </p>
              <p className="mt-1 text-ink">Até 30 dias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
