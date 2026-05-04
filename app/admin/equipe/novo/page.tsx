import Link from "next/link";

import { requireAdmin } from "@/lib/auth-helpers";

import { createTeamMember } from "../_actions";
import { TeamForm } from "../_form";

export default async function NewTeamMemberPage() {
  const session = await requireAdmin();
  const canManage =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  if (!canManage) {
    return (
      <div>
        <header className="border-b border-line pb-7">
          <Link
            href="/admin/equipe"
            className="inline-flex w-fit items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Equipe
          </Link>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
            Sem permissão
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Apenas Owners e Admins podem adicionar membros.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <Link
          href="/admin/equipe"
          className="inline-flex w-fit items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
        >
          ← Equipe
        </Link>
        <p className="eyebrow">Pessoas</p>
        <h1 className="display text-[clamp(28px,3vw,36px)]">
          Adicionar membro
        </h1>
        <p className="text-[13px] text-ink-soft">
          O novo usuário recebe acesso imediato com a senha definida aqui.
          Compartilhe num canal seguro (1Password, Bitwarden, etc.).
        </p>
      </header>

      <div className="mt-8">
        <TeamForm
          mode="create"
          submitLabel="Adicionar membro"
          action={createTeamMember}
        />
      </div>
    </div>
  );
}
