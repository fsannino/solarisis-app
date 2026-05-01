import { redirect } from "next/navigation";

import { auth } from "@/auth/admin";

/**
 * Garante que existe sessão de admin. Usar no topo de Server Components
 * e Server Actions sob /admin/*. Retorna a sessão (já validada).
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }
  return session;
}
