"use client";

import { useActionState } from "react";

import type { ProductFormState } from "./_actions";
import {
  ProductImagesEditor,
  type ProductImageEntry
} from "./_product-images";

type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: "ADULTO" | "INFANTIL" | "ACESSORIO";
  gender: "FEMININO" | "MASCULINO" | "UNISSEX" | "MENINA" | "MENINO";
  type: string;
  fps: number;
  basePrice: string;
  salePrice: string;
  costPrice: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  images: ProductImageEntry[];
};

type Props = {
  defaultValues?: Partial<ProductFormValues>;
  action: (
    prev: ProductFormState | undefined,
    formData: FormData
  ) => Promise<ProductFormState>;
  submitLabel: string;
};

const CATEGORY_OPTIONS = [
  { value: "ADULTO", label: "Adulto" },
  { value: "INFANTIL", label: "Mini (Infantil)" },
  { value: "ACESSORIO", label: "Acessório" }
] as const;

const GENDER_OPTIONS = [
  { value: "FEMININO", label: "Feminino" },
  { value: "MASCULINO", label: "Masculino" },
  { value: "UNISSEX", label: "Unissex" },
  { value: "MENINA", label: "Menina" },
  { value: "MENINO", label: "Menino" }
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo · visível na loja" },
  { value: "DRAFT", label: "Rascunho · oculto" },
  { value: "ARCHIVED", label: "Arquivado" }
] as const;

export function ProductForm({ defaultValues, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<
    ProductFormState | undefined,
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
      {state && state.ok && (
        <p className="rounded-md border border-orange/30 bg-orange-soft px-4 py-3 text-sm text-ink">
          Salvo com sucesso.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Coluna principal */}
        <div className="flex flex-col gap-6">
          <Card title="Identificação">
            <Field label="Nome do produto" error={fieldErrors?.name?.[0]}>
              <input
                name="name"
                type="text"
                required
                defaultValue={defaultValues?.name}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU" error={fieldErrors?.sku?.[0]}>
                <input
                  name="sku"
                  type="text"
                  required
                  defaultValue={defaultValues?.sku}
                  className={`${inputClass} font-mono`}
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
                  placeholder={defaultValues?.slug ?? "ex: maio-solis-floral"}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>

            <Field
              label="Tipo"
              help='ex: "Maiô", "Biquíni", "Macacão", "Camiseta UV"'
              error={fieldErrors?.type?.[0]}
            >
              <input
                name="type"
                type="text"
                required
                defaultValue={defaultValues?.type}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria" error={fieldErrors?.category?.[0]}>
                <select
                  name="category"
                  required
                  defaultValue={defaultValues?.category}
                  className={inputClass}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Gênero" error={fieldErrors?.gender?.[0]}>
                <select
                  name="gender"
                  required
                  defaultValue={defaultValues?.gender}
                  className={inputClass}
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          <Card title="Descrição">
            <Field label="Descrição completa" error={fieldErrors?.description?.[0]}>
              <textarea
                name="description"
                required
                rows={6}
                defaultValue={defaultValues?.description}
                className={inputClass}
                placeholder="Pra quem é, como usa, o que tem de especial..."
              />
            </Field>
          </Card>

          <Card title="Fotos & mídia">
            <ProductImagesEditor initial={defaultValues?.images ?? []} />
          </Card>

          <Card title="Tecnologia">
            <Field label="FPU" error={fieldErrors?.fps?.[0]}>
              <input
                name="fps"
                type="number"
                min={0}
                max={100}
                required
                defaultValue={defaultValues?.fps ?? 50}
                className={inputClass}
              />
            </Field>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-6">
          <Card title="Status & visibilidade">
            <Field label="Status">
              <select
                name="status"
                required
                defaultValue={defaultValues?.status ?? "DRAFT"}
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

          <Card title="Preço">
            <Field label="Preço base (R$)" error={fieldErrors?.basePrice?.[0]}>
              <input
                name="basePrice"
                type="text"
                inputMode="decimal"
                required
                defaultValue={defaultValues?.basePrice}
                placeholder="489.00"
                className={`${inputClass} font-serif text-lg font-medium`}
              />
            </Field>
            <Field
              label="Promoção (R$)"
              help="Vazio = sem promoção"
              error={fieldErrors?.salePrice?.[0]}
            >
              <input
                name="salePrice"
                type="text"
                inputMode="decimal"
                defaultValue={defaultValues?.salePrice}
                placeholder="389.00"
                className={inputClass}
              />
            </Field>
            <Field
              label="Custo (R$)"
              help="Interno — não aparece pra cliente"
              error={fieldErrors?.costPrice?.[0]}
            >
              <input
                name="costPrice"
                type="text"
                inputMode="decimal"
                defaultValue={defaultValues?.costPrice}
                placeholder="180.00"
                className={inputClass}
              />
            </Field>
          </Card>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-ink px-7 py-3 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-ink"
          >
            {pending ? "Salvando…" : submitLabel}
            {!pending && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            )}
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
