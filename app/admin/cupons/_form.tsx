"use client";

import { useActionState, useState } from "react";

import type { CouponFormState } from "./_actions";

type Props = {
  defaultValues?: {
    code?: string;
    type?: "PERCENT" | "FIXED" | "FREE_SHIPPING";
    value?: string;
    minOrderValue?: string;
    maxUses?: string;
    perCustomerLimit?: string;
    validFrom?: string;
    validUntil?: string;
    status?: "active" | "paused" | "expired";
  };
  action: (
    prev: CouponFormState | undefined,
    formData: FormData
  ) => Promise<CouponFormState>;
  submitLabel: string;
};

const TYPE_OPTIONS: {
  value: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  label: string;
  hint: string;
}[] = [
  {
    value: "PERCENT",
    label: "Porcentagem",
    hint: "Desconto % no subtotal"
  },
  {
    value: "FIXED",
    label: "Valor fixo",
    hint: "Desconto R$ no subtotal"
  },
  {
    value: "FREE_SHIPPING",
    label: "Frete grátis",
    hint: "Zera o frete (independente do valor)"
  }
];

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo · funciona no checkout" },
  { value: "paused", label: "Pausado · oculto no checkout" },
  { value: "expired", label: "Expirado" }
] as const;

export function CouponForm({ defaultValues, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<
    CouponFormState | undefined,
    FormData
  >(action, undefined);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  const [type, setType] = useState(defaultValues?.type ?? "PERCENT");
  const showValue = type !== "FREE_SHIPPING";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state && !state.ok && state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state && state.ok && (
        <p className="rounded-md border border-orange/30 bg-orange-soft px-4 py-3 text-sm text-ink">
          Salvo com sucesso.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Código & tipo">
            <Field label="Código do cupom" error={fieldErrors?.code?.[0]}>
              <input
                name="code"
                type="text"
                required
                defaultValue={defaultValues?.code}
                placeholder="VERAO26"
                className={`${inputClass} font-mono uppercase tracking-[0.04em]`}
              />
            </Field>

            <Field label="Tipo de desconto">
              <div className="grid gap-2 sm:grid-cols-3">
                {TYPE_OPTIONS.map((opt) => {
                  const active = type === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`cursor-pointer rounded-md border p-3 transition-colors ${
                        active
                          ? "border-orange bg-orange-soft/40"
                          : "border-line bg-bone hover:border-ink"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={opt.value}
                        checked={active}
                        onChange={() => setType(opt.value)}
                        className="sr-only"
                      />
                      <p className="text-[13px] font-medium text-ink">
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-soft">
                        {opt.hint}
                      </p>
                    </label>
                  );
                })}
              </div>
            </Field>

            {showValue && (
              <Field
                label={
                  type === "PERCENT"
                    ? "Valor do desconto (%)"
                    : "Valor do desconto (R$)"
                }
                error={fieldErrors?.value?.[0]}
              >
                <input
                  name="value"
                  type="text"
                  inputMode="decimal"
                  required
                  defaultValue={defaultValues?.value}
                  placeholder={type === "PERCENT" ? "10" : "50.00"}
                  className={`${inputClass} font-serif text-lg font-medium`}
                />
              </Field>
            )}
          </Card>

          <Card title="Regras de uso">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Valor mínimo do pedido (R$)"
                help="Vazio = sem mínimo"
                error={fieldErrors?.minOrderValue?.[0]}
              >
                <input
                  name="minOrderValue"
                  type="text"
                  inputMode="decimal"
                  defaultValue={defaultValues?.minOrderValue}
                  placeholder="299.00"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Total de usos"
                help="Vazio = ilimitado"
                error={fieldErrors?.maxUses?.[0]}
              >
                <input
                  name="maxUses"
                  type="text"
                  inputMode="numeric"
                  defaultValue={defaultValues?.maxUses}
                  placeholder="100"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Limite por cliente"
                help="Vazio = sem limite"
                error={fieldErrors?.perCustomerLimit?.[0]}
              >
                <input
                  name="perCustomerLimit"
                  type="text"
                  inputMode="numeric"
                  defaultValue={defaultValues?.perCustomerLimit}
                  placeholder="1"
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>

          <Card title="Validade">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Válido a partir de" error={fieldErrors?.validFrom?.[0]}>
                <input
                  name="validFrom"
                  type="datetime-local"
                  required
                  defaultValue={defaultValues?.validFrom}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Válido até"
                help="Vazio = sem prazo"
                error={fieldErrors?.validUntil?.[0]}
              >
                <input
                  name="validUntil"
                  type="datetime-local"
                  defaultValue={defaultValues?.validUntil}
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Status">
            <Field label="Estado">
              <select
                name="status"
                required
                defaultValue={defaultValues?.status ?? "active"}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

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
      {error && (
        <p className="mt-1 text-[11px] text-destructive">{error}</p>
      )}
      {!error && help && (
        <p className="mt-1 text-[11px] text-ink-faint">{help}</p>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none";
