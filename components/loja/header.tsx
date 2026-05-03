import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, User } from "lucide-react";
import { cartItemCount, getCart } from "@/lib/cart";

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
          <Link
            href="/carrinho"
            aria-label={`Sacola (${count} itens)`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-bone transition-colors hover:bg-orange md:gap-2.5 md:pl-4 md:pr-4"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
            <span className="hidden md:inline">Sacola</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1.5 text-[11px] font-bold text-white">
              {count}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
