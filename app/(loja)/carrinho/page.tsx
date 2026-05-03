import Link from "next/link";
import Image from "next/image";
import { getCart, cartSubtotal, cartItemCount } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";
import { removeCartItem, updateCartItem } from "../_actions";

const FRETE_GRATIS_MIN = 299;

export default async function CarrinhoPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];
  const subtotal = cartSubtotal(cart);
  const count = cartItemCount(cart);
  const faltaFreteGratis = Math.max(0, FRETE_GRATIS_MIN - subtotal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl italic text-ink md:text-5xl">
          Carrinho
        </h1>
        {count > 0 && (
          <p className="text-sm text-ink-soft">
            {count} {count === 1 ? "item" : "itens"}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="font-serif text-2xl italic text-ink">
            Seu carrinho está vazio.
          </p>
          <p className="text-sm text-ink-soft">
            Veja o que tem na loja — tem peça nova chegando.
          </p>
          <Button asChild className="mt-4">
            <Link href="/loja">Ir pra loja</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {items.map((it) => {
              const product = it.variant.product;
              const image =
                product.images.find((i) => i.isPrimary) ?? product.images[0];
              const unit =
                it.variant.priceOverride?.toNumber() ??
                product.salePrice?.toNumber() ??
                product.basePrice.toNumber();
              const lineTotal = unit * it.quantity;
              const variantLabel = [it.variant.color, it.variant.size]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={it.id}
                  className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start"
                >
                  <Link
                    href={`/produtos/${product.slug}`}
                    className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-line"
                  >
                    {image && (
                      <Image
                        src={image.url}
                        alt={image.alt ?? product.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/produtos/${product.slug}`}
                          className="font-serif text-xl italic text-ink hover:text-orange"
                        >
                          {product.name}
                        </Link>
                        {variantLabel && (
                          <p className="text-sm text-ink-soft">
                            {variantLabel}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-faint">
                          {formatBRL(unit)} · cada
                        </p>
                      </div>
                      <p className="text-base text-ink">
                        {formatBRL(lineTotal)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <form
                        action={updateCartItem}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="itemId" value={it.id} />
                        <label className="text-xs uppercase tracking-widest text-ink-soft">
                          Qtd
                        </label>
                        <select
                          name="quantity"
                          defaultValue={it.quantity}
                          className="h-9 rounded-md border border-line-strong bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                        >
                          {Array.from(
                            { length: Math.min(it.variant.stock, 10) },
                            (_, n) => n + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                        >
                          Atualizar
                        </button>
                      </form>

                      <form action={removeCartItem}>
                        <input type="hidden" name="itemId" value={it.id} />
                        <button
                          type="submit"
                          className="text-xs text-ink-soft underline-offset-4 hover:text-destructive hover:underline"
                        >
                          Remover
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="flex flex-col gap-4 self-start rounded-2xl border border-line bg-surface p-6">
            <p className="text-xs uppercase tracking-widest text-ink-soft">
              Resumo
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="text-ink">{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Frete</span>
              <span className="text-ink-soft">calculado no checkout</span>
            </div>

            {faltaFreteGratis > 0 ? (
              <p className="rounded-md bg-orange-soft px-3 py-2 text-xs text-ink">
                Faltam <strong>{formatBRL(faltaFreteGratis)}</strong> pra você
                ganhar frete grátis.
              </p>
            ) : (
              <p className="rounded-md bg-orange-soft px-3 py-2 text-xs text-ink">
                Você ganhou frete grátis.
              </p>
            )}

            <div className="border-t border-line pt-4">
              <div className="flex justify-between font-serif text-xl italic">
                <span>Total estimado</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
            </div>

            <Button size="lg" asChild className="mt-2">
              <Link href="/checkout">Ir pro checkout</Link>
            </Button>
            <Link
              href="/loja"
              className="text-center text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
