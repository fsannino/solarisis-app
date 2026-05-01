import { auth } from "@/auth/admin";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Páginas como /admin/login não têm sessão; renderiza só o conteúdo.
  // (proxy.ts cuida do redirect dos protegidos.)
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="bg-bg min-h-screen">
      <AdminSidebar />
      <div className="md:pl-60">
        <AdminTopbar
          user={{ name: session.user.name, email: session.user.email }}
        />
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
