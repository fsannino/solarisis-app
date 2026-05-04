import Link from "next/link";
import { UserRole, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

const ROLE_LABEL: Record<UserRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STOCK: "Estoque",
  SUPPORT: "Atendimento",
  MARKETING: "Marketing",
  STAFF: "Staff"
};

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  SUSPENDED: "Suspenso"
};

export default async function TeamAdminPage() {
  const session = await requireAdmin();
  const canManage =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastActiveAt: true,
      createdAt: true,
      image: true
    }
  });

  const ownerCount = users.filter((u) => u.role === "OWNER").length;
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Pessoas</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">Equipe</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {users.length} {users.length === 1 ? "membro" : "membros"} ·{" "}
            {activeCount} ativos · {ownerCount}{" "}
            {ownerCount === 1 ? "owner" : "owners"}
          </p>
        </div>
        {canManage && (
          <Link
            href="/admin/equipe/novo"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar membro
          </Link>
        )}
      </header>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sand/50">
              {["Membro", "Função", "Status", "Última atividade", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-line px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-soft"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const initials = u.name
                .split(/\s+/)
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <tr
                  key={u.id}
                  className={`group ${
                    i < users.length - 1 ? "border-b border-line" : ""
                  } ${canManage ? "cursor-pointer hover:bg-sand/40" : ""}`}
                >
                  <td className="px-4 py-3.5">
                    <Cell href={canManage ? `/admin/equipe/${u.id}` : null}>
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-soft font-mono text-[11px] font-semibold text-orange">
                          {initials}
                        </span>
                        <span>
                          <span className="block text-[13px] font-medium text-ink">
                            {u.name}
                            {u.id === session.user.id && (
                              <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-faint">
                                · você
                              </span>
                            )}
                          </span>
                          <span className="block text-[11px] text-ink-faint">
                            {u.email}
                          </span>
                        </span>
                      </span>
                    </Cell>
                  </td>
                  <td className="px-4 py-3.5">
                    <Cell href={canManage ? `/admin/equipe/${u.id}` : null}>
                      <RolePill role={u.role} />
                    </Cell>
                  </td>
                  <td className="px-4 py-3.5">
                    <Cell href={canManage ? `/admin/equipe/${u.id}` : null}>
                      <StatusPill status={u.status} />
                    </Cell>
                  </td>
                  <td className="px-4 py-3.5">
                    <Cell href={canManage ? `/admin/equipe/${u.id}` : null}>
                      <span className="text-[12px] text-ink-soft">
                        {u.lastActiveAt
                          ? u.lastActiveAt.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "—"}
                      </span>
                    </Cell>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {canManage ? (
                      <Cell href={`/admin/equipe/${u.id}`}>
                        <span className="text-ink-faint group-hover:text-ink">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </span>
                      </Cell>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {!canManage && (
        <p className="mt-4 text-[12px] text-ink-faint">
          Apenas Owners e Admins podem editar membros.
        </p>
      )}
    </div>
  );
}

function Cell({
  href,
  children
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block">
      {children}
    </Link>
  );
}

function RolePill({ role }: { role: UserRole }) {
  const tones: Record<UserRole, string> = {
    OWNER: "bg-ink text-bone",
    ADMIN: "bg-orange-soft text-orange",
    STOCK: "bg-sand text-ink",
    SUPPORT: "bg-sand text-ink",
    MARKETING: "bg-sand text-ink",
    STAFF: "bg-line text-ink-soft"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[role]}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

function StatusPill({ status }: { status: UserStatus }) {
  const tones: Record<UserStatus, string> = {
    ACTIVE: "bg-green/20 text-green",
    INVITED: "bg-orange-soft text-orange",
    SUSPENDED: "bg-line text-ink-faint"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${tones[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
