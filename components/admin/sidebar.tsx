"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href?: string; badge?: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Visão geral",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Relatórios", href: "/admin/relatorios" }
    ]
  },
  {
    title: "Vendas",
    items: [
      { label: "Pedidos", href: "/admin/pedidos" },
      { label: "Pagamentos", href: "/admin/pagamentos" },
      { label: "Devoluções", href: "/admin/devolucoes" },
      { label: "Cupons", href: "/admin/cupons" }
    ]
  },
  {
    title: "Catálogo",
    items: [
      { label: "Produtos", href: "/admin/produtos" },
      { label: "Biblioteca de mídia", href: "/admin/midia" },
      { label: "Estoque", href: "/admin/estoque" },
      { label: "Coleções", href: "/admin/colecoes" }
    ]
  },
  {
    title: "Canais",
    items: [{ label: "Marketplaces" }, { label: "Conteúdo do site" }]
  },
  {
    title: "Pessoas",
    items: [
      { label: "Clientes", href: "/admin/clientes" },
      { label: "Equipe", href: "/admin/equipe" }
    ]
  },
  {
    title: "Sistema",
    items: [
      { label: "Notificações" },
      { label: "Configurações", href: "/admin/configuracoes" }
    ]
  }
];

export function AdminSidebar({
  user
}: {
  user?: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();
  const initials = (user?.name ?? user?.email ?? "S")
    .split(/[\s@]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const displayName = user?.name ?? user?.email ?? "Solarisis";

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface md:flex">
      <div className="border-b border-line px-5 py-5">
        <Link href="/admin" className="flex flex-col gap-1">
          <Image
            src="/assets/solarisis-logo-horizontal-transparent.png"
            alt="Solarisis"
            width={140}
            height={28}
            className="h-7 w-auto"
          />
          <span className="pl-1 text-[11px] text-ink-faint">painel admin</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="eyebrow mb-1.5 px-5 text-[10px]">{group.title}</p>
            <ul>
              {group.items.map((item) => {
                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className="flex items-center justify-between px-5 py-1.5 text-[13px] text-ink-faint">
                        {item.label}
                        <span className="font-mono text-[10px] uppercase tracking-wider">
                          soon
                        </span>
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
                      className={`flex items-center gap-3 border-l-2 px-[18px] py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "border-orange bg-orange-soft font-semibold text-orange"
                          : "border-transparent font-medium text-ink-soft hover:bg-bone hover:text-ink"
                      }`}
                    >
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-orange px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-soft text-[12px] font-semibold text-orange">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">
            {displayName}
          </p>
          {user?.name && (
            <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
