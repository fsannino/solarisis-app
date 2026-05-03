import { prisma } from "@/lib/db";
import { ProductCategory } from "@prisma/client";

import { Hero } from "@/components/loja/home/hero";
import { FeaturedMarquee } from "@/components/loja/home/featured-marquee";
import { Benefits } from "@/components/loja/home/benefits";
import { CategoryDuo } from "@/components/loja/home/category-duo";
import { FeaturedProducts } from "@/components/loja/home/featured-products";
import { QuoteBand } from "@/components/loja/home/quote-band";
import { Testimonials } from "@/components/loja/home/testimonials";
import { InstagramStrip } from "@/components/loja/home/instagram-strip";
import { NewsletterCta } from "@/components/loja/home/newsletter-cta";

type ProductWithRel = Awaited<ReturnType<typeof loadAdult>>[number];

async function loadAdult() {
  return prisma.product.findMany({
    where: { status: "ACTIVE", category: { not: ProductCategory.INFANTIL } },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true, color: true } }
    }
  });
}

async function loadKids() {
  return prisma.product.findMany({
    where: { status: "ACTIVE", category: ProductCategory.INFANTIL },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true, color: true } }
    }
  });
}

function toCard(p: ProductWithRel) {
  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
  const colorCount = new Set(p.variants.map((v) => v.color).filter(Boolean))
    .size;
  return {
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
  };
}

export default async function HomePage() {
  const [featured, kids] = await Promise.all([loadAdult(), loadKids()]);

  return (
    <>
      <Hero />
      <FeaturedMarquee />
      <Benefits />
      <CategoryDuo />

      {featured.length > 0 && (
        <FeaturedProducts
          eyebrow="Em destaque"
          title={
            <>
              Solar Flow <em className="not-italic italic">— os queridos.</em>
            </>
          }
          cta="Ver coleção completa"
          products={featured.map(toCard)}
        />
      )}

      <QuoteBand />

      {kids.length > 0 && (
        <FeaturedProducts
          eyebrow="Linha mini"
          title={
            <>
              Raiz Mini{" "}
              <em className="not-italic italic">— do mergulho ao recreio.</em>
            </>
          }
          cta="Ver linha infantil"
          ctaHref="/loja?categoria=INFANTIL"
          products={kids.map(toCard)}
        />
      )}

      <Testimonials />
      <InstagramStrip />
      <NewsletterCta />
    </>
  );
}
