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
    <main className="flex min-h-screen items-center justify-center bg-bone px-4 py-20">
      <div className="w-full max-w-md border border-line bg-surface p-10 md:p-12">
        <p className="eyebrow">Solarisis</p>
        <h1 className="display mt-3 text-[40px]">
          Sua <em className="not-italic italic text-orange">conta</em>.
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Entre para acompanhar pedidos, salvar endereços e favoritos.
        </p>

        {error && (
          <p className="mt-6 text-sm text-destructive">
            Não conseguimos entrar. Tente de novo.
          </p>
        )}

        <form action={handleGoogleSignIn} className="mt-8">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-transparent py-3.5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bone [&:hover_path]:fill-bone"
          >
            <GoogleMark />
            Continuar com Google
          </button>
        </form>

        <p className="eyebrow mt-10 text-center text-[10px]">
          Outros métodos de login virão em breve
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
