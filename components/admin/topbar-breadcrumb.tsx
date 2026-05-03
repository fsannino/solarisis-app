"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/admin": "Visão geral",
  "/admin/pedidos": "Pedidos",
  "/admin/produtos": "Produtos",
  "/admin/produtos/novo": "Novo produto"
};

function titleFor(pathname: string) {
  if (pathname.startsWith("/admin/pedidos/")) return "Pedido";
  if (pathname.startsWith("/admin/produtos/")) return "Produto";
  return TITLES[pathname] ?? "Solarisis";
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const title = titleFor(pathname);
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="text-ink-soft">Solarisis</span>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-faint">
        <path d="M9 18l6-6-6-6" />
      </svg>
      <span className="font-medium text-ink">{title}</span>
    </div>
  );
}
