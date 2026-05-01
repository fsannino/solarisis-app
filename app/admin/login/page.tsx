import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

type SearchParams = Promise<{ from?: string; error?: string }>;

export default async function AdminLoginPage(props: { searchParams: SearchParams }) {
  const session = await auth();
  if (session) {
    redirect("/admin");
  }

  const { from, error } = await props.searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: from && from.startsWith("/admin") ? from : "/admin"
    });
  }

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-6 py-20">
      <div className="bg-surface border-line w-full max-w-md rounded-xl border p-10 shadow-sm">
        <p className="text-ink-soft text-xs uppercase tracking-widest">Solarisis</p>
        <h1 className="font-serif mt-2 text-3xl italic">Painel admin</h1>
        <p className="text-ink-soft mt-2 text-sm">Acesso restrito à equipe.</p>

        <form action={handleLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-ink text-sm">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="border-line focus:border-orange mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-ink text-sm">Senha</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="border-line focus:border-orange mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-700">
              Não conseguimos entrar com esses dados. Verifique e tente de novo.
            </p>
          ) : null}

          <button
            type="submit"
            className="bg-orange w-full rounded-md py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
