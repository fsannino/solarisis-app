import Link from "next/link";
import Image from "next/image";

import { getCart, cartSubtotal } from "@/lib/cart";
import { formatBRL } from "@/lib/utils";
import { removeCartItem } from "@/app/(loja)/_actions";
import { QtySelect } from "@/components/loja/qty-select";

const FRETE_GRATIS_MIN = 399;

export async function CartDrawerContent() {
  const cart = await getCart();
  const items = cart?.items ?? [];
  const subtotal = cartSubtotal(cart);
  const faltaFreteGratis = Math.max(0, FRETE_GRATIS_MIN - subtotal);

  return (
    <>
      <header className="flex items-start justify-between border-b border-line px-7 py-6">
        <div>
          <p className="eyebrow">Sua sacola</p>
          <p className="display mt-1 text-[24px]">
            {items.length} {items.length === 1 ? "peça" : "peças"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 text-5xl opacity-40">🌅</div>
            <p className="display text-[24px]">Tudo calmo por aqui.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              Hora de escolher sua próxima peça de sol.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((it) => {
              const product = it.variant.product;
              const image =
                product.images.find((i) => i.isPrimary) ?? product.images[0];
              const unit =
                it.variant.priceOverride?.toNumber() ??
                product.salePrice?.toNumber() ??
                product.basePrice.toNumber();
              const variantLabel = [it.variant.color, it.variant.size]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={it.id} className="flex gap-4 py-5">
                  <Link
                    href={`/produtos/${product.slug}`}
                    className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-sand"
                  >
                    {image && (
                      <Image
                        src={image.url}
                        alt={image.alt ?? product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/produtos/${product.slug}`}
                        className="font-serif text-[16px] font-medium leading-tight text-ink hover:text-orange"
                      >
                        {product.name}
                      </Link>
                      <form action={removeCartItem}>
                        <input type="hidden" name="itemId" value={it.id} />
                        <button
                          type="submit"
                          aria-label="Remover"
                          className="text-ink-soft hover:text-destructive"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </form>
                    </div>
                    {variantLabel && (
                      <p className="eyebrow text-[10px]">{variantLabel}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <QtySelect
                        itemId={it.id}
                        defaultQty={it.quantity}
                        maxQty={it.variant.stock}
                      />
                      <p className="font-serif text-[15px] font-medium text-ink">
                        {formatBRL(unit * it.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <footer className="flex flex-col gap-4 border-t border-line px-7 py-6">
          {faltaFreteGratis > 0 ? (
            <p className="bg-orange-soft px-4 py-2.5 text-[12px] leading-[1.5] text-ink">
              Faltam <strong>{formatBRL(faltaFreteGratis)}</strong> pra frete grátis.
            </p>
          ) : (
            <p className="bg-orange px-4 py-2.5 text-[12px] font-semibold leading-[1.5] text-white">
              Você ganhou frete grátis 🌞
            </p>
          )}

          <div className="flex items-baseline justify-between">
            <span className="font-serif text-[14px] italic text-ink-soft">
              Subtotal
            </span>
            <span className="display text-[24px]">{formatBRL(subtotal)}</span>
          </div>
          <p className="eyebrow text-[10px]">
            Frete e impostos calculados no checkout
          </p>

          <Link
            href="/checkout"
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
          >
            Finalizar compra
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/carrinho"
            className="text-center text-[12px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Ver sacola completa →
          </Link>
        </footer>
      )}
    </>
  );
}
