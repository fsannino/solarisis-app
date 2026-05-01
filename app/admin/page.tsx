import { requireAdmin } from "@/lib/auth-helpers";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <div>
      <header className="border-line border-b pb-6">
        <p className="text-ink-soft text-xs uppercase tracking-widest">Visão geral</p>
        <h1 className="font-serif mt-1 text-3xl italic">
          Bem-vinda, {session.user.name?.split(" ")[0] ?? session.user.email}.
        </h1>
      </header>

      <section className="mt-10">
        <p className="text-ink-soft text-sm">
          Cards e gráficos do dashboard virão em PRs separadas. Por enquanto, comece pelos
          produtos.
        </p>
      </section>
    </div>
  );
}
