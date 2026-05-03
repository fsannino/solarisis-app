import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth/customer";
import { getCart, cartSubtotal } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Faça login pra usar cupom." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!code.trim()) {
    return NextResponse.json(
      { ok: false, error: "Informe um código." },
      { status: 400 }
    );
  }

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Carrinho vazio." },
      { status: 400 }
    );
  }

  const subtotal = cartSubtotal(cart);
  const result = await validateCoupon({
    code,
    subtotal,
    customerId: session.user.id
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    code: result.coupon.code,
    discount: result.discount,
    freeShipping: result.freeShipping,
    type: result.coupon.type
  });
}
