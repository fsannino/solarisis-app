"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href?: string };
type NavGroup = { title: string; items: NavItem[] };

// Navegação completa conforme SCHEMA.md. Itens sem `href` aparecem
// como "em breve" — vão ganhar links conforme as PRs próximas.
const NAV: NavGroup[] = [
  {
    title: "Visão geral",
    items: [{ label: "Dashboard", href: "/admin" }]
  },
  {
    title: "Vendas",
    items: [
      { label: "Pedidos", href: "/admin/pedidos" },
      { label: "Pagamentos" },
      { label: "Devoluções" },
      { label: "Cupons" }
    ]
  },
  {
    title: "Catálogo",
    items: [
      { label: "Produtos", href: "/admin/produtos" },
      { label: "Estoque" },
      { label: "Coleções" }
    ]
  },
  {
    title: "Canais",
    items: [{ label: "Marketplaces" }, { label: "Conteúdo do site" }]
  },
  {
    title: "CRM",
    items: [{ label: "Clientes" }, { label: "Equipe" }]
  },
  {
    title: "Inteligência",
    items: [{ label: "Relatórios" }, { label: "Notificações" }]
  },
  {
    title: "Sistema",
    items: [{ label: "Configurações" }]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface border-line fixed inset-y-0 left-0 hidden w-60 flex-col border-r md:flex">
      <div className="border-line border-b px-6 py-5">
        <Link href="/admin" className="block">
          <p className="text-ink-soft text-[10px] uppercase tracking-widest">Solarisis</p>
          <p className="font-serif text-xl italic">Admin</p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="text-ink-faint mb-1.5 px-3 text-[10px] uppercase tracking-widest">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className="text-ink-faint flex items-center justify-between rounded-md px-3 py-1.5 text-sm">
                        {item.label}
                        <span className="text-[10px] uppercase tracking-wider">soon</span>
                      </span>
                    </li>
                  );
                }
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`block rounded-md px-3 py-1.5 text-sm transition ${
                        isActive
                          ? "bg-orange-soft text-ink"
                          : "text-ink-soft hover:bg-bg hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
