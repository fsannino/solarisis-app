import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const CART_COOKIE = "solarisis_cart_id";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 dias

export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        variant: {
          include: {
            product: { include: { images: true } };
          };
        };
      };
    };
  };
}>;

export async function getCartIdFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export async function setCartCookie(cartId: string) {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });
}

/**
 * Lê o carrinho atual a partir do cookie. Retorna null se não houver
 * carrinho criado ainda. Não cria carrinho — fluxo de leitura puro.
 */
export async function getCart(): Promise<CartWithItems | null> {
  const cartId = await getCartIdFromCookie();
  if (!cartId) return null;

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          variant: {
            include: {
              product: { include: { images: true } }
            }
          }
        }
      }
    }
  });

  return cart;
}

/**
 * Garante um carrinho persistido. Se não existir cookie ou o cart
 * referenciado tiver sido deletado, cria um novo e seta o cookie.
 */
export async function getOrCreateCart(): Promise<CartWithItems> {
  const existing = await getCart();
  if (existing) return existing;

  const cart = await prisma.cart.create({
    data: {},
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { images: true } }
            }
          }
        }
      }
    }
  });
  await setCartCookie(cart.id);
  return cart;
}

export function cartItemCount(cart: CartWithItems | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, it) => sum + it.quantity, 0);
}

export function cartSubtotal(cart: CartWithItems | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, it) => {
    const unit =
      it.variant.priceOverride?.toNumber() ??
      it.variant.product.salePrice?.toNumber() ??
      it.variant.product.basePrice.toNumber();
    return sum + unit * it.quantity;
  }, 0);
}
