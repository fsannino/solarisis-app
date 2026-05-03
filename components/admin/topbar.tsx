import Link from "next/link";

import { signOut } from "@/auth/admin";
import { AdminBreadcrumb } from "./topbar-breadcrumb";

export function AdminTopbar() {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface px-6">
      <AdminBreadcrumb />
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="hidden items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-ink md:inline-flex"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
            <path d="M14 4h6v6" />
            <path d="M11 13L20 4" />
          </svg>
          Ver loja
        </Link>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="rounded-full border border-line-strong px-3.5 py-1.5 text-[12px] font-medium text-ink-soft transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bone"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
