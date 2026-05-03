import { Coupon, CouponType } from "@prisma/client";

import { prisma } from "@/lib/db";

export type CouponValidation =
  | {
      ok: true;
      coupon: Coupon;
      discount: number; // valor em R$ a abater do subtotal
      freeShipping: boolean;
    }
  | { ok: false; error: string };

/**
 * Valida o código contra as regras (status, validade, mínimo, limite,
 * por-cliente) e calcula o desconto sobre `subtotal`.
 *
 * `customerId` é usado pra checar limite por cliente (quantos pedidos
 * já aplicaram esse cupom). Se ausente, ignora a regra.
 */
export async function validateCoupon(input: {
  code: string;
  subtotal: number;
  customerId?: string;
}): Promise<CouponValidation> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Informe um código." };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) {
    return { ok: false, error: "Cupom não encontrado." };
  }

  if (coupon.status !== "active") {
    return { ok: false, error: "Esse cupom não está ativo." };
  }

  const now = new Date();
  if (coupon.validFrom > now) {
    return { ok: false, error: "Esse cupom ainda não começou a valer." };
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    return { ok: false, error: "Esse cupom expirou." };
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Esse cupom já atingiu o limite de usos." };
  }

  if (coupon.minOrderValue != null) {
    const min = coupon.minOrderValue.toNumber();
    if (input.subtotal < min) {
      return {
        ok: false,
        error: `Valor mínimo do pedido pra esse cupom: R$ ${min.toFixed(2).replace(".", ",")}.`
      };
    }
  }

  if (input.customerId && coupon.perCustomerLimit != null) {
    const used = await prisma.order.count({
      where: {
        couponCode: code,
        customerId: input.customerId
      }
    });
    if (used >= coupon.perCustomerLimit) {
      return {
        ok: false,
        error: `Você já usou esse cupom o número máximo de vezes (${coupon.perCustomerLimit}).`
      };
    }
  }

  // Calcula desconto
  let discount = 0;
  let freeShipping = false;
  switch (coupon.type as CouponType) {
    case "PERCENT": {
      const pct = coupon.value.toNumber();
      discount = Math.min(input.subtotal, (input.subtotal * pct) / 100);
      break;
    }
    case "FIXED": {
      discount = Math.min(input.subtotal, coupon.value.toNumber());
      break;
    }
    case "FREE_SHIPPING": {
      freeShipping = true;
      break;
    }
  }

  return {
    ok: true,
    coupon,
    discount: Number(discount.toFixed(2)),
    freeShipping
  };
}

/**
 * Incrementa usedCount do cupom. Chamar dentro da transação que cria
 * o Order.
 */
export async function consumeCoupon(
  tx: { coupon: { update: typeof prisma.coupon.update } },
  code: string
) {
  await tx.coupon.update({
    where: { code },
    data: { usedCount: { increment: 1 } }
  });
}
