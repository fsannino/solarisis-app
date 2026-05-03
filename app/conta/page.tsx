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

  const firstName = session.user.name?.split(" ")[0] ?? "amiga";

  return (
    <main className="min-h-screen bg-bone px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
          <div>
            <p className="eyebrow">Solarisis · Conta</p>
            <h1 className="display mt-3 text-[clamp(36px,5vw,56px)]">
              Olá,{" "}
              <em className="not-italic italic text-orange">{firstName}</em>.
            </h1>
          </div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bone"
            >
              Sair
            </button>
          </form>
        </header>

        <section className="mt-10 max-w-[640px]">
          <p className="text-[15px] leading-[1.6] text-ink-soft">
            Em breve você vai ver aqui seus pedidos, endereços salvos,
            favoritos e devoluções. Por enquanto, qualquer pedido feito
            chega no seu email — e você acompanha pelo link enviado.
          </p>
        </section>
      </div>
    </main>
  );
}
