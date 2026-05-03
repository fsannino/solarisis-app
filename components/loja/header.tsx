import Link from "next/link";
import Image from "next/image";
import { Search, User } from "lucide-react";
import { cartItemCount, getCart } from "@/lib/cart";
import { CartDrawer } from "@/components/loja/cart-drawer";
import { CartDrawerContent } from "@/components/loja/cart-drawer-content";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/loja", label: "Loja" },
  { href: "/colecoes", label: "Coleções" },
  { href: "/sobre", label: "Sobre" },
  { href: "/diario", label: "Diário" }
];

export async function Header() {
  const cart = await getCart();
  const count = cartItemCount(cart);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bone/[0.92] backdrop-blur-md supports-[backdrop-filter]:bg-bone/80">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-4 md:px-8">
        <Link
          href="/"
          aria-label="Solarisis — início"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/assets/solarisis-logo-horizontal-transparent.png"
            alt="Solarisis"
            width={160}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink transition-colors hover:text-orange"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Buscar"
            className="hidden h-[38px] w-[38px] items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone md:inline-flex"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
          <Link
            href="/conta"
            aria-label="Minha conta"
            className="hidden h-[38px] w-[38px] items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone md:inline-flex"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </Link>
          <CartDrawer count={count}>
            <CartDrawerContent />
          </CartDrawer>
        </div>
      </div>
    </header>
  );
}
