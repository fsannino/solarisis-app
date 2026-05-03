import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { cartItemCount, getCart } from "@/lib/cart";

const NAV = [
  { href: "/loja", label: "Loja" },
  { href: "/loja?categoria=ADULTO", label: "Adulto" },
  { href: "/loja?categoria=INFANTIL", label: "Infantil" },
  { href: "/loja?categoria=ACESSORIO", label: "Acessórios" }
];

export async function Header() {
  const cart = await getCart();
  const count = cartItemCount(cart);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="font-serif text-2xl italic text-ink"
          aria-label="Solarisis — início"
        >
          Solarisis
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/conta"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-orange-soft hover:text-ink"
            aria-label="Minha conta"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-orange-soft hover:text-ink"
            aria-label={`Carrinho (${count} itens)`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-medium text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
