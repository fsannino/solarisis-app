import { signOut } from "@/auth/admin";

type Props = {
  user: { name?: string | null; email?: string | null };
};

export function AdminTopbar({ user }: Props) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <header className="border-line bg-surface flex h-14 items-center justify-between border-b px-6">
      <div />
      <form action={handleSignOut} className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-ink text-sm leading-tight">{user.name ?? user.email}</p>
          {user.name ? (
            <p className="text-ink-faint text-xs leading-tight">{user.email}</p>
          ) : null}
        </div>
        <button
          type="submit"
          className="border-line text-ink-soft hover:border-line-strong hover:text-ink rounded-md border px-3 py-1.5 text-xs transition"
        >
          Sair
        </button>
      </form>
    </header>
  );
}
