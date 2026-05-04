"use client";

import { useActionState } from "react";

import type { TeamFormState } from "./_actions";

const ROLE_OPTIONS: { value: string; label: string; help: string }[] = [
  {
    value: "OWNER",
    label: "Owner",
    help: "Acesso total. Só OWNER pode promover outro OWNER."
  },
  {
    value: "ADMIN",
    label: "Admin",
    help: "Gerencia tudo do dia-a-dia, exceto OWNERs."
  },
  { value: "STOCK", label: "Estoque", help: "Catálogo, mídia, estoque." },
  {
    value: "SUPPORT",
    label: "Atendimento",
    help: "Pedidos, clientes e devoluções."
  },
  {
    value: "MARKETING",
    label: "Marketing",
    help: "Cupons, coleções, conteúdo."
  },
  {
    value: "STAFF",
    label: "Staff",
    help: "Sem permissões — usar como base pra customização."
  }
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INVITED", label: "Convidado" },
  { value: "SUSPENDED", label: "Suspenso" }
];

type Props = {
  mode: "create" | "edit";
  defaults?: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  };
  emailReadonly?: boolean;
  passwordRequired?: boolean;
  passwordLabel?: string;
  showStatus?: boolean;
  submitLabel: string;
  action: (
    prev: TeamFormState | undefined,
    formData: FormData
  ) => Promise<TeamFormState>;
};

export function TeamForm({
  mode,
  defaults,
  emailReadonly,
  passwordRequired = mode === "create",
  passwordLabel = mode === "create" ? "Senha inicial" : "Nova senha",
  showStatus = mode === "edit",
  submitLabel,
  action
}: Props) {
  const [state, formAction, pending] = useActionState<
    TeamFormState | undefined,
    FormData
  >(action, undefined);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state && !state.ok && state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state && state.ok && mode === "edit" && (
        <p className="rounded-md border border-orange/30 bg-orange-soft px-4 py-3 text-sm text-ink">
          Salvo com sucesso.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Identificação">
            <Field label="Nome" error={fieldErrors?.name?.[0]}>
              <input
                name="name"
                type="text"
                required
                defaultValue={defaults?.name}
                placeholder="Maria da Silva"
                className={inputClass}
              />
            </Field>
            <Field
              label="E-mail"
              error={fieldErrors?.email?.[0]}
              help={
                emailReadonly
                  ? "E-mail não pode ser alterado depois da criação."
                  : undefined
              }
            >
              <input
                name="email"
                type="email"
                required
                defaultValue={defaults?.email}
                readOnly={emailReadonly}
                placeholder="maria@solarisis.com.br"
                className={`${inputClass} ${
                  emailReadonly ? "bg-line/30 text-ink-soft" : ""
                }`}
              />
            </Field>
            <Field
              label={passwordLabel}
              error={fieldErrors?.password?.[0]}
              help={
                mode === "create"
                  ? "Mínimo 8 caracteres. Compartilhe com o membro num canal seguro."
                  : "Deixe em branco pra manter a senha atual."
              }
            >
              <input
                name="password"
                type="password"
                required={passwordRequired}
                minLength={passwordRequired ? 8 : undefined}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className={`${inputClass} font-mono`}
              />
            </Field>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Função">
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const checked = (defaults?.role ?? "STAFF") === opt.value;
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-bone p-3 hover:border-ink-faint"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      defaultChecked={checked}
                      required
                      className="mt-1 h-4 w-4 accent-orange"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink">
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-ink-soft">
                        {opt.help}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>

          {showStatus && (
            <Card title="Status">
              <Field label="Acesso ao painel">
                <select
                  name="status"
                  required
                  defaultValue={defaults?.status ?? "ACTIVE"}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            </Card>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-ink px-7 py-3 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink"
          >
            {pending ? "Salvando…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="eyebrow mb-4">{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  error,
  children
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
      {!error && help && (
        <p className="mt-1 text-[11px] text-ink-faint">{help}</p>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none";
