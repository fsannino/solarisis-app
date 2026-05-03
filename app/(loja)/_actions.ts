"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { CART_COOKIE, getOrCreateCart } from "@/lib/cart";
import { cookies } from "next/headers";

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  redirectTo: z.string().optional()
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addToCart(formData: FormData): Promise<ActionResult> {
  const parsed = addSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
    redirectTo: formData.get("redirectTo") ?? undefined
  });
  if (!parsed.success) {
    return { ok: false, error: "Selecione uma variante válida." };
  }
  const { variantId, quantity, redirectTo } = parsed.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stock: true, productId: true }
  });
  if (!variant) {
    return { ok: false, error: "Variante não encontrada." };
  }

  const cart = await getOrCreateCart();

  const existing = cart.items.find((it) => it.variantId === variantId);
  const desiredQty = (existing?.quantity ?? 0) + quantity;

  if (desiredQty > variant.stock) {
    return {
      ok: false,
      error: `Estoque insuficiente — disponível: ${variant.stock}.`
    };
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: desiredQty },
    create: { cartId: cart.id, variantId, quantity }
  });

  revalidatePath("/", "layout");
  if (redirectTo) {
    redirect(redirectTo);
  }
  return { ok: true };
}

const updateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(20)
});

export async function updateCartItem(formData: FormData): Promise<void> {
  const parsed = updateSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity")
  });
  if (!parsed.success) return;
  const { itemId, quantity } = parsed.data;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { variant: { select: { stock: true } } }
  });
  if (!item) return;

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const safeQty = Math.min(quantity, item.variant.stock);
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: safeQty }
    });
  }
  revalidatePath("/", "layout");
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");
  if (typeof itemId !== "string" || !itemId) return;
  await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => null);
  revalidatePath("/", "layout");
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;
  if (!cartId) return;
  await prisma.cartItem.deleteMany({ where: { cartId } });
  revalidatePath("/", "layout");
}
