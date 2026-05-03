import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { ProductGallery } from "@/components/loja/product-gallery";
import { VariantSelector } from "@/components/loja/variant-selector";
import { ProductTabs } from "@/components/loja/product-tabs";
import { ProductCard } from "@/components/loja/product-card";

const CATEGORY_LABEL: Record<string, string> = {
  ADULTO: "Adulto",
  INFANTIL: "Mini",
  ACESSORIO: "Acessórios"
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      seoTitle: true,
      seoDescription: true,
      description: true
    }
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
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      collections: { include: { collection: true } }
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

  // 4 produtos relacionados — mesma categoria, exclui o atual
  const relatedRaw = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      category: product.category,
      id: { not: product.id }
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true, color: true } }
    }
  });

  const collectionLabel = product.collections[0]?.collection.name;

  return (
    <main>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8">
        <nav className="eyebrow flex flex-wrap items-center gap-2 text-[10px]">
          <Link href="/" className="hover:text-orange">
            Início
          </Link>
          <span>/</span>
          <Link href="/loja" className="hover:text-orange">
            Loja
          </Link>
          <span>/</span>
          <Link
            href={`/loja?linha=${product.category === "INFANTIL" ? "mini" : "adulto"}`}
            className="hover:text-orange"
          >
            {CATEGORY_LABEL[product.category] ?? product.category}
          </Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      {/* Galeria + Info */}
      <section className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8 md:pt-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <ProductGallery
            images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
            productName={product.name}
          />

          <div className="flex flex-col gap-7 lg:sticky lg:top-24 lg:self-start">
            {collectionLabel && (
              <p className="eyebrow">· Coleção {collectionLabel}</p>
            )}
            <h1 className="display text-[clamp(40px,5vw,56px)] leading-none">
              {product.name}
            </h1>

            <VariantSelector
              variants={variantOptions}
              basePrice={product.basePrice.toNumber()}
              salePrice={product.salePrice?.toNumber() ?? null}
            />

            <ProductTabs
              tabs={[
                {
                  id: "descricao",
                  label: "Descrição",
                  content: <p className="m-0">{product.description}</p>
                },
                {
                  id: "tecnologia",
                  label: "Tecnologia",
                  content: (
                    <ul className="m-0 list-disc space-y-1.5 pl-5">
                      <li>
                        Tecido com bloqueio de até 98% dos raios UVA e UVB
                      </li>
                      <li>FPU {product.fps}+ certificado AS/NZS 4399</li>
                      <li>Secagem rápida e respirabilidade térmica</li>
                      <li>Resistência ao sal, cloro e exposição solar</li>
                      <li>Costura plana sem atrito na pele</li>
                      {product.materials.length > 0 && (
                        <li>
                          Composição:{" "}
                          <span className="text-ink">
                            {product.materials.join(" · ")}
                          </span>
                        </li>
                      )}
                    </ul>
                  )
                },
                {
                  id: "cuidados",
                  label: "Cuidados",
                  content: (
                    <ul className="m-0 list-disc space-y-1.5 pl-5">
                      <li>Lave à mão com água fria após o uso</li>
                      <li>Não usar alvejante ou amaciante</li>
                      <li>Secar à sombra para preservar a cor</li>
                      <li>Não passar a ferro nas estampas</li>
                    </ul>
                  )
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Relacionados */}
      {relatedRaw.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 pt-30 pb-20 md:px-8">
          <h2 className="display mb-8 text-[clamp(36px,4vw,48px)]">
            Combina com{" "}
            <em className="not-italic italic">esta peça</em>.
          </h2>
          <div className="grid grid-cols-2 gap-x-7 gap-y-12 md:grid-cols-4">
            {relatedRaw.map((p) => {
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
        </section>
      )}
    </main>
  );
}
