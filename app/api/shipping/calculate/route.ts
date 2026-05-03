import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCart } from "@/lib/cart";
import { calculateShipping, type ShippingOption } from "@/lib/melhor-envio";
import { FREE_SHIPPING_MIN, SHIPPING_FLAT } from "@/lib/checkout";

const bodySchema = z.object({
  cep: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, { message: "CEP inválido" })
});

export type ShippingResponse =
  | {
      ok: true;
      source: "melhor-envio" | "fallback";
      subtotal: number;
      freeShippingThreshold: number;
      qualifiesForFreeShipping: boolean;
      options: (ShippingOption & { id: string })[];
    }
  | { ok: false; error: string };

/**
 * POST /api/shipping/calculate { cep }
 *
 * Lê o carrinho do cookie, monta os products pra Melhor Envio e devolve
 * as opções disponíveis. Sem ME_TOKEN configurado, devolve uma única
 * opção fallback (frete fixo) — útil pra dev sem credencial.
 */
export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    const body = await req.json();
    parsed = bodySchema.parse(body);
  } catch (err) {
    return NextResponse.json<ShippingResponse>(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Requisição inválida."
      },
      { status: 400 }
    );
  }

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return NextResponse.json<ShippingResponse>(
      { ok: false, error: "Carrinho vazio." },
      { status: 400 }
    );
  }

  const subtotal = cart.items.reduce((sum, it) => {
    const unit =
      it.variant.priceOverride?.toNumber() ??
      it.variant.product.salePrice?.toNumber() ??
      it.variant.product.basePrice.toNumber();
    return sum + unit * it.quantity;
  }, 0);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_MIN;

  const items = cart.items.map((it) => {
    const dim = (it.variant.product.dimensions ?? null) as
      | { length?: number; width?: number; height?: number }
      | null;
    const unit =
      it.variant.priceOverride?.toNumber() ??
      it.variant.product.salePrice?.toNumber() ??
      it.variant.product.basePrice.toNumber();
    return {
      id: it.variantId,
      quantity: it.quantity,
      weight: it.variant.weight ?? it.variant.product.weight ?? null,
      width: dim?.width ?? null,
      height: dim?.height ?? null,
      length: dim?.length ?? null,
      insuranceValue: unit
    };
  });

  const meOptions = await calculateShipping({ toCep: parsed.cep, items });

  if (meOptions && meOptions.length > 0) {
    const adjusted = meOptions.map((o) => ({
      ...o,
      id: `me:${o.serviceId}`,
      price: qualifiesForFreeShipping ? 0 : o.price
    }));
    return NextResponse.json<ShippingResponse>({
      ok: true,
      source: "melhor-envio",
      subtotal,
      freeShippingThreshold: FREE_SHIPPING_MIN,
      qualifiesForFreeShipping,
      options: adjusted
    });
  }

  // Fallback: ME indisponível ou sem token. Devolve uma opção fixa.
  return NextResponse.json<ShippingResponse>({
    ok: true,
    source: "fallback",
    subtotal,
    freeShippingThreshold: FREE_SHIPPING_MIN,
    qualifiesForFreeShipping,
    options: [
      {
        id: "fallback:flat",
        serviceId: 0,
        name: "Envio padrão",
        company: "Correios",
        price: qualifiesForFreeShipping ? 0 : SHIPPING_FLAT,
        deliveryDays: 7
      }
    ]
  });
}
