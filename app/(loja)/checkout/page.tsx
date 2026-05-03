import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { getCart, cartSubtotal, cartItemCount } from "@/lib/cart";
import { requireCustomer } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";

import { FREE_SHIPPING_MIN, SHIPPING_FLAT } from "@/lib/checkout";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout — Solarisis"
};

export default async function CheckoutPage() {
  const session = await requireCustomer("/checkout");

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    redirect("/carrinho");
  }

  const subtotal = cartSubtotal(cart);
  const count = cartItemCount(cart);
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 1 }
    }
  });
  const addr = customer?.addresses[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-widest text-ink-soft">
        Checkout
      </p>
      <h1 className="mt-2 font-serif text-4xl italic text-ink md:text-5xl">
        Falta pouco, {session.user.name?.split(" ")[0]}.
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <CheckoutForm
          defaults={{
            recipient: addr?.recipient ?? customer?.name,
            cpf: customer?.cpf ?? undefined,
            phone: customer?.phone ?? undefined,
            cep: addr?.cep,
            street: addr?.street,
            number: addr?.number,
            complement: addr?.complement ?? undefined,
            district: addr?.district,
            city: addr?.city,
            state: addr?.state
          }}
        />

        <aside className="self-start rounded-2xl border border-line bg-surface p-6">
          <p className="text-xs uppercase tracking-widest text-ink-soft">
            Resumo · {count} {count === 1 ? "item" : "itens"}
          </p>

          <ul className="mt-4 flex flex-col divide-y divide-line">
            {cart.items.map((it) => {
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
                <li key={it.id} className="flex gap-3 py-3 first:pt-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-line">
                    {image && (
                      <Image
                        src={image.url}
                        alt={image.alt ?? product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col text-sm">
                    <p className="font-serif italic text-ink">
                      {product.name}
                    </p>
                    {variantLabel && (
                      <p className="text-xs text-ink-soft">{variantLabel}</p>
                    )}
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {it.quantity} × {formatBRL(unit)}
                    </p>
                  </div>
                  <p className="text-sm text-ink">
                    {formatBRL(unit * it.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="text-ink">{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Frete</span>
              <span className="text-ink">
                {shipping === 0 ? "Grátis" : formatBRL(shipping)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-line pt-4 font-serif text-xl italic">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>

          <p className="mt-4 text-xs text-ink-faint">
            Frete fixo de {formatBRL(SHIPPING_FLAT)} (grátis acima de{" "}
            {formatBRL(FREE_SHIPPING_MIN)}). Cálculo via Melhor Envio chega
            no próximo passo.
          </p>
        </aside>
      </div>
    </div>
  );
}
