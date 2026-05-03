"use client";

import { useActionState, useState } from "react";
import Image from "next/image";

import { MediaPicker } from "@/components/admin/media-picker";

import type { CollectionFormState } from "./_actions";

type Props = {
  defaultValues?: {
    name?: string;
    slug?: string;
    description?: string;
    heroImageUrl?: string;
    featured?: boolean;
    status?: "active" | "draft";
    order?: number;
  };
  action: (
    prev: CollectionFormState | undefined,
    formData: FormData
  ) => Promise<CollectionFormState>;
  submitLabel: string;
};

export function CollectionForm({
  defaultValues,
  action,
  submitLabel
}: Props) {
  const [state, formAction, pending] = useActionState<
    CollectionFormState | undefined,
    FormData
  >(action, undefined);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  const [heroUrl, setHeroUrl] = useState(defaultValues?.heroImageUrl ?? "");

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
          <Card title="Identificação">
            <Field label="Nome" error={fieldErrors?.name?.[0]}>
              <input
                name="name"
                type="text"
                required
                defaultValue={defaultValues?.name}
                placeholder="Solar Flow"
                className={inputClass}
              />
            </Field>
            <Field
              label="Slug"
              help="Vazio = a partir do nome"
              error={fieldErrors?.slug?.[0]}
            >
              <input
                name="slug"
                type="text"
                defaultValue={defaultValues?.slug}
                placeholder="solar-flow"
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="Descrição" error={fieldErrors?.description?.[0]}>
              <textarea
                name="description"
                rows={3}
                defaultValue={defaultValues?.description ?? ""}
                placeholder="Cortes fluidos e estampas vibrantes..."
                className={inputClass}
              />
            </Field>
          </Card>

          <Card title="Imagem de capa">
            <input type="hidden" name="heroImageUrl" value={heroUrl} />
            {heroUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-sand">
                  <Image
                    src={heroUrl}
                    alt="Capa"
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <MediaPicker
                    excludeUrls={[heroUrl]}
                    onSelect={(asset) => setHeroUrl(asset.url)}
                    trigger={
                      <button
                        type="button"
                        className="rounded-full border border-line-strong px-4 py-2 text-[12px] font-medium text-ink hover:border-ink hover:bg-ink hover:text-bone"
                      >
                        Trocar imagem
                      </button>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setHeroUrl("")}
                    className="rounded-full border border-destructive/40 px-4 py-2 text-[12px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <MediaPicker
                onSelect={(asset) => setHeroUrl(asset.url)}
                trigger={
                  <button
                    type="button"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-ink hover:bg-ink hover:text-bone"
                  >
                    + Escolher imagem
                  </button>
                }
              />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Status">
            <Field label="Visibilidade">
              <select
                name="status"
                defaultValue={defaultValues?.status ?? "draft"}
                className={inputClass}
              >
                <option value="active">Ativa · visível na loja</option>
                <option value="draft">Rascunho · oculta</option>
              </select>
            </Field>
            <Field label="Ordem">
              <input
                name="order"
                type="number"
                min={0}
                defaultValue={defaultValues?.order ?? 0}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={defaultValues?.featured ?? false}
                className="h-4 w-4 accent-orange"
              />
              Em destaque (aparece na home)
            </label>
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
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
      {!error && help && (
        <p className="mt-1 text-[11px] text-ink-faint">{help}</p>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] text-ink focus-visible:border-ink focus-visible:outline-none";
