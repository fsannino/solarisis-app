import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth/customer";

type SearchParams = Promise<{ from?: string; error?: string }>;

export default async function CustomerLoginPage(props: { searchParams: SearchParams }) {
  const session = await auth();
  if (session) {
    redirect("/conta");
  }

  const { from, error } = await props.searchParams;
  const callbackUrl = from && from.startsWith("/") && !from.startsWith("/admin") ? from : "/conta";

  async function handleGoogleSignIn() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-6 py-20">
      <div className="bg-surface border-line w-full max-w-md rounded-xl border p-10 shadow-sm">
        <p className="text-ink-soft text-xs uppercase tracking-widest">Solarisis</p>
        <h1 className="font-serif mt-2 text-3xl italic">Sua conta</h1>
        <p className="text-ink-soft mt-2 text-sm">
          Entre para acompanhar pedidos, salvar endereços e favoritos.
        </p>

        {error ? (
          <p className="mt-6 text-sm text-red-700">
            Não conseguimos entrar. Tente de novo.
          </p>
        ) : null}

        <form action={handleGoogleSignIn} className="mt-8">
          <button
            type="submit"
            className="border-line hover:border-line-strong bg-surface flex w-full items-center justify-center gap-3 rounded-md border py-3 text-sm font-medium transition"
          >
            <GoogleMark />
            Continuar com Google
          </button>
        </form>

        <p className="text-ink-faint mt-8 text-center text-xs">
          Outros métodos de login virão em breve.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
