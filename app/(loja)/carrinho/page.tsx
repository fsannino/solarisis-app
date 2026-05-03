import Link from "next/link";
import Image from "next/image";
import { getCart, cartSubtotal, cartItemCount } from "@/lib/cart";
import { formatBRL } from "@/lib/utils";
import { removeCartItem, updateCartItem } from "../_actions";

const FRETE_GRATIS_MIN = 399;

export default async function CarrinhoPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];
  const subtotal = cartSubtotal(cart);
  const count = cartItemCount(cart);
  const faltaFreteGratis = Math.max(0, FRETE_GRATIS_MIN - subtotal);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Sua sacola</p>
          <h1 className="display mt-3 text-[clamp(40px,5vw,64px)]">
            Carrinho
          </h1>
        </div>
        {count > 0 && (
          <p className="eyebrow text-[10px]">
            {count} {count === 1 ? "peça" : "peças"}
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-5 py-20 text-center">
          <div className="text-5xl opacity-40">🌅</div>
          <p className="display text-[28px]">Tudo calmo por aqui.</p>
          <p className="text-[14px] text-ink-soft">
            Hora de escolher sua próxima peça de sol.
          </p>
          <Link
            href="/loja"
            className="mt-3 inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
          >
            Ir pra loja
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
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
                  className="flex flex-col gap-5 py-7 sm:flex-row sm:items-start"
                >
                  <Link
                    href={`/produtos/${product.slug}`}
                    className="relative aspect-[4/5] w-32 shrink-0 overflow-hidden bg-sand"
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
                  <div className="flex flex-1 flex-col gap-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/produtos/${product.slug}`}
                          className="font-serif text-[20px] font-medium text-ink hover:text-orange"
                        >
                          {product.name}
                        </Link>
                        {variantLabel && (
                          <p className="eyebrow mt-1 text-[10px]">
                            {variantLabel}
                          </p>
                        )}
                        <p className="mt-1 text-[12px] text-ink-faint">
                          {formatBRL(unit)} · cada
                        </p>
                      </div>
                      <p className="font-serif text-[18px] font-medium text-ink">
                        {formatBRL(lineTotal)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <form
                        action={updateCartItem}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="itemId" value={it.id} />
                        <label className="eyebrow text-[10px]">Qtd</label>
                        <select
                          name="quantity"
                          defaultValue={it.quantity}
                          className="h-9 rounded-full border border-line-strong bg-transparent px-3 text-sm text-ink focus-visible:border-ink focus-visible:outline-none"
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
                          className="text-[12px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                        >
                          Atualizar
                        </button>
                      </form>

                      <form action={removeCartItem}>
                        <input type="hidden" name="itemId" value={it.id} />
                        <button
                          type="submit"
                          className="text-[12px] text-ink-soft underline-offset-4 hover:text-destructive hover:underline"
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

          <aside className="flex flex-col gap-5 self-start border border-line bg-surface p-7">
            <p className="eyebrow">Resumo</p>
            <div className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="text-ink">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Frete</span>
                <span className="text-ink-soft">calculado no checkout</span>
              </div>
            </div>

            {faltaFreteGratis > 0 ? (
              <p className="bg-orange-soft px-4 py-3 text-[12px] leading-[1.5] text-ink">
                Faltam <strong>{formatBRL(faltaFreteGratis)}</strong> pra você
                ganhar frete grátis.
              </p>
            ) : (
              <p className="bg-orange px-4 py-3 text-[12px] font-semibold leading-[1.5] text-white">
                Você ganhou frete grátis 🌞
              </p>
            )}

            <div className="flex justify-between border-t border-line pt-5">
              <span className="font-serif text-[15px] italic text-ink-soft">
                Total estimado
              </span>
              <span className="display text-[26px]">{formatBRL(subtotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
            >
              Finalizar compra
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/loja"
              className="text-center text-[12px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              Continuar comprando →
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
