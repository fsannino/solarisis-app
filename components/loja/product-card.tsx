import Link from "next/link";
import Image from "next/image";
import { formatBRL } from "@/lib/utils";

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
  /** Número de variantes de cor distintas */
  colorCount?: number;
  /** Tag editorial: "Bestseller", "Novo", "Edição limitada" */
  tag?: string | null;
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const onSale =
    product.salePrice != null && product.salePrice < product.basePrice;
  const displayPrice = onSale ? product.salePrice! : product.basePrice;
  const tag = product.tag ?? (onSale ? "Em oferta" : null);
  const colorLabel =
    product.colorCount && product.colorCount > 1
      ? `${product.colorCount} cores`
      : null;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : null}

        {tag && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-bone">
            {tag}
          </span>
        )}

        <span
          aria-hidden
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-bone/90 text-ink transition-colors group-hover:bg-orange group-hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
          </svg>
        </span>

        {!product.outOfStock && (
          <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 flex justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-bone transition-colors group-hover:bg-orange">
              Adicionar
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </div>
        )}

        {product.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-bone/70">
            <span className="rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-bone">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3.5">
        <div>
          <p className="font-serif text-lg font-medium leading-tight tracking-[-0.01em] text-ink">
            {product.name}
          </p>
          <p className="eyebrow mt-1 text-[10px]">
            FPS {product.fps}+{colorLabel ? ` · ${colorLabel}` : ""}
          </p>
        </div>
        <p className="font-serif text-[17px] font-medium text-ink">
          {onSale ? (
            <>
              <span className="text-ink-faint line-through">
                {formatBRL(product.basePrice)}
              </span>{" "}
              <span className="text-orange">{formatBRL(displayPrice)}</span>
            </>
          ) : (
            formatBRL(displayPrice)
          )}
        </p>
      </div>
    </Link>
  );
}
