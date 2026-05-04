"use client";

import { useActionState } from "react";

import type { SettingsFormState } from "./_actions";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea";
  defaultValue: string | number;
  placeholder?: string;
  help?: string;
  prefix?: string;
  required?: boolean;
};

type Props = {
  title: string;
  description?: string;
  fields: Field[];
  action: (
    prev: SettingsFormState | undefined,
    formData: FormData
  ) => Promise<SettingsFormState>;
};

export function SectionForm({ title, description, fields, action }: Props) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState | undefined,
    FormData
  >(action, undefined);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <header className="mb-4">
        <p className="eyebrow">{title}</p>
        {description && (
          <p className="mt-1.5 text-[13px] text-ink-soft">{description}</p>
        )}
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        {state && !state.ok && state.error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
            {state.error}
          </p>
        )}
        {state && state.ok && (
          <p className="rounded-md border border-orange/30 bg-orange-soft px-4 py-2.5 text-[13px] text-ink">
            Salvo com sucesso.
          </p>
        )}

        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="text-[13px] font-medium text-ink">{f.label}</span>
            <div className="relative mt-1.5">
              {f.prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-faint">
                  {f.prefix}
                </span>
              )}
              {f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  rows={3}
                  required={f.required}
                  defaultValue={f.defaultValue}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              ) : (
                <input
                  name={f.name}
                  type={f.type ?? "text"}
                  required={f.required}
                  defaultValue={f.defaultValue}
                  placeholder={f.placeholder}
                  className={`${inputClass} ${f.prefix ? "pl-10" : ""}`}
                  step={f.type === "number" ? "0.01" : undefined}
                  min={f.type === "number" ? 0 : undefined}
                />
              )}
            </div>
            {fieldErrors?.[f.name]?.[0] && (
              <p className="mt-1 text-[11px] text-destructive">
                {fieldErrors[f.name][0]}
              </p>
            )}
            {!fieldErrors?.[f.name]?.[0] && f.help && (
              <p className="mt-1 text-[11px] text-ink-faint">{f.help}</p>
            )}
          </label>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none";
