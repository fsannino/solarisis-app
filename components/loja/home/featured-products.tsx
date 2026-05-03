import Link from "next/link";
import { ProductCard } from "@/components/loja/product-card";

type Item = {
  slug: string;
  name: string;
  type: string;
  fps: number;
  basePrice: number;
  salePrice?: number | null;
  imageUrl?: string;
  imageAlt?: string;
  outOfStock?: boolean;
  colorCount?: number;
  tag?: string | null;
};

export function FeaturedProducts({
  eyebrow,
  title,
  cta,
  ctaHref = "/loja",
  products
}: {
  eyebrow: string;
  title: React.ReactNode;
  cta?: string;
  ctaHref?: string;
  products: Item[];
}) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-30 md:px-8">
      <div className="mb-9 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3.5">{eyebrow}</p>
          <h2 className="display text-[clamp(36px,4.5vw,56px)]">{title}</h2>
        </div>
        {cta && (
          <Link
            href={ctaHref}
            className="hidden whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:text-orange md:inline-flex md:items-center md:gap-1.5"
          >
            {cta} <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-7">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
