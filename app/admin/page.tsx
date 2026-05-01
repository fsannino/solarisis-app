import { auth, signOut } from "@/auth";

export default async function AdminDashboardPage() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <main className="bg-bg min-h-screen px-8 py-12 md:px-16">
      <header className="border-line flex items-center justify-between border-b pb-6">
        <div>
          <p className="text-ink-soft text-xs uppercase tracking-widest">Solarisis · Admin</p>
          <h1 className="font-serif mt-1 text-3xl italic">Bem-vinda, {session?.user?.name}.</h1>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="border-line text-ink hover:border-line-strong rounded-md border px-4 py-2 text-sm transition"
          >
            Sair
          </button>
        </form>
      </header>

      <section className="mt-10">
        <p className="text-ink-soft text-sm">
          Painel em construção — telas (Pedidos, Produtos, Estoque etc.) virão em PRs separadas
          seguindo <code>SCHEMA.md</code>.
        </p>
      </section>
    </main>
  );
}
