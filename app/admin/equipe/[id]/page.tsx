import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import { deleteTeamMember, updateTeamMember } from "../_actions";
import { TeamForm } from "../_form";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTeamMemberPage({ params }: PageProps) {
  const session = await requireAdmin();
  const canManage =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastActiveAt: true,
      createdAt: true
    }
  });
  if (!user) notFound();

  const isSelf = user.id === session.user.id;
  const canDelete =
    session.user.role === "OWNER" && !isSelf && canManage;

  const update = updateTeamMember.bind(null, user.id);

  async function handleDelete() {
    "use server";
    await deleteTeamMember(user!.id);
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-7">
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/equipe"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
          >
            ← Equipe
          </Link>
          <h1 className="display text-[clamp(28px,3vw,36px)]">{user.name}</h1>
          <p className="font-mono text-[11px] text-ink-soft">
            {user.email}
            {isSelf && " · você"}
            {user.lastActiveAt &&
              ` · última atividade ${user.lastActiveAt.toLocaleDateString(
                "pt-BR"
              )}`}
          </p>
        </div>
        {canDelete && (
          <form action={handleDelete}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              Excluir membro
            </button>
          </form>
        )}
      </header>

      <div className="mt-8">
        <TeamForm
          mode="edit"
          emailReadonly
          showStatus
          submitLabel="Salvar alterações"
          defaults={{
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
          }}
          action={update}
        />
      </div>

      {!canManage && (
        <p className="mt-4 text-[12px] text-ink-faint">
          Apenas Owners e Admins podem editar membros.
        </p>
      )}
    </div>
  );
}
