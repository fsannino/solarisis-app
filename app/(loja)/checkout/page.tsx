import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { getCart, cartSubtotal, cartItemCount } from "@/lib/cart";
import { requireCustomer } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";
import { FREE_SHIPPING_MIN } from "@/lib/checkout";

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

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 1 }
    }
  });
  const addr = customer?.addresses[0];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
      <p className="eyebrow">Checkout</p>
      <h1 className="display mt-3 text-[clamp(40px,5vw,64px)]">
        Falta pouco,{" "}
        <em className="not-italic italic text-orange">
          {session.user.name?.split(" ")[0]}
        </em>
        .
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <CheckoutForm
          subtotal={subtotal}
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

        <aside className="self-start border border-line bg-surface p-7">
          <p className="eyebrow">
            Seus itens · {count} {count === 1 ? "peça" : "peças"}
          </p>

          <ul className="mt-5 flex flex-col divide-y divide-line">
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
                <li key={it.id} className="flex gap-3.5 py-4 first:pt-0">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
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
                    <p className="font-serif text-[15px] font-medium text-ink">
                      {product.name}
                    </p>
                    {variantLabel && (
                      <p className="eyebrow mt-1 text-[10px]">{variantLabel}</p>
                    )}
                    <p className="mt-1 text-xs text-ink-faint">
                      {it.quantity} × {formatBRL(unit)}
                    </p>
                  </div>
                  <p className="font-serif text-[14px] font-medium text-ink">
                    {formatBRL(unit * it.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="font-serif text-[15px] italic text-ink-soft">
              Subtotal
            </span>
            <span className="display text-[24px]">{formatBRL(subtotal)}</span>
          </div>

          <p className="mt-4 text-xs text-ink-faint">
            Frete grátis acima de {formatBRL(FREE_SHIPPING_MIN)}. Total final
            (com frete) aparece no formulário ao lado.
          </p>
        </aside>
      </div>
    </div>
  );
}
