import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth/customer";

export default async function CustomerAccountPage() {
  const session = await auth();
  if (!session) {
    redirect("/conta/login");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="bg-bg min-h-screen px-6 py-12 md:px-12">
      <header className="border-line flex items-center justify-between border-b pb-6">
        <div>
          <p className="text-ink-soft text-xs uppercase tracking-widest">Solarisis · Conta</p>
          <h1 className="font-serif mt-1 text-3xl italic">Olá, {session.user.name}.</h1>
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

      <section className="mt-10 max-w-2xl">
        <p className="text-ink-soft text-sm">
          Em breve: seus pedidos, endereços, favoritos e devoluções.
        </p>
      </section>
    </main>
  );
}
