import Link from "next/link";
import Image from "next/image";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ProductCardProduct = {
  slug: string;
  name: string;
  type: string;
  fps: number;
  basePrice: number;
  salePrice?: number | null;
  imageUrl?: string;
  imageAlt?: string;
  outOfStock?: boolean;
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const onSale =
    product.salePrice != null && product.salePrice < product.basePrice;
  const displayPrice = onSale ? product.salePrice! : product.basePrice;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col gap-3"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-line">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <Badge variant="soft">FPS {product.fps}+</Badge>
          {onSale && <Badge>Em oferta</Badge>}
        </div>
        {product.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <Badge variant="muted">Esgotado</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs uppercase tracking-widest text-ink-faint">
          {product.type}
        </p>
        <p className="font-serif text-lg leading-tight text-ink">
          {product.name}
        </p>
        <p className="mt-1 text-sm">
          {onSale ? (
            <>
              <span className="text-ink-faint line-through">
                {formatBRL(product.basePrice)}
              </span>{" "}
              <span className="font-medium text-orange">
                {formatBRL(displayPrice)}
              </span>
            </>
          ) : (
            <span className="text-ink">{formatBRL(displayPrice)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
