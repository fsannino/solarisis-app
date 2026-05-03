import { redirect } from "next/navigation";

import { auth as adminAuth } from "@/auth/admin";
import { auth as customerAuth } from "@/auth/customer";

/**
 * Garante que existe sessão de admin. Usar no topo de Server Components
 * e Server Actions sob /admin/*. Retorna a sessão (já validada).
 */
export async function requireAdmin() {
  const session = await adminAuth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Garante sessão de cliente. Redireciona para /conta/login mantendo
 * `from=` para voltar ao destino original após o login.
 */
export async function requireCustomer(returnTo: string) {
  const session = await customerAuth();
  if (!session?.user?.id) {
    const safe =
      returnTo.startsWith("/") && !returnTo.startsWith("/admin")
        ? returnTo
        : "/conta";
    redirect(`/conta/login?from=${encodeURIComponent(safe)}`);
  }
  return session;
}
