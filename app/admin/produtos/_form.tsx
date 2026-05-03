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
  { value: "INFANTIL", label: "Infantil" },
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
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "ARCHIVED", label: "Arquivado" }
] as const;

export function ProductForm({ defaultValues, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<ProductFormState | undefined, FormData>(
    action,
    undefined
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-8">
      {state && !state.ok && state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}
      {state && state.ok ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Salvo com sucesso.
        </p>
      ) : null}

      <Section title="Geral">
        <Field label="Nome" error={fieldErrors?.name?.[0]}>
          <input
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            className={inputClass}
          />
        </Field>

        <Field
          label="Slug"
          help="Vazio = gerar a partir do nome. Use só minúsculas, números e hífens."
          error={fieldErrors?.slug?.[0]}
        >
          <input
            name="slug"
            type="text"
            defaultValue={defaultValues?.slug}
            placeholder={defaultValues?.slug ?? "ex: camiseta-praia-fps50"}
            className={inputClass}
          />
        </Field>

        <Field label="SKU" error={fieldErrors?.sku?.[0]}>
          <input
            name="sku"
            type="text"
            required
            defaultValue={defaultValues?.sku}
            className={inputClass}
          />
        </Field>

        <Field label="Descrição" error={fieldErrors?.description?.[0]}>
          <textarea
            name="description"
            required
            rows={5}
            defaultValue={defaultValues?.description}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Classificação">
        <div className="grid grid-cols-2 gap-4">
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

          <Field label="Tipo" help='ex: "biquíni", "camiseta", "macacão"' error={fieldErrors?.type?.[0]}>
            <input
              name="type"
              type="text"
              required
              defaultValue={defaultValues?.type}
              className={inputClass}
            />
          </Field>

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
        </div>
      </Section>

      <Section title="Preço">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Base (R$)" error={fieldErrors?.basePrice?.[0]}>
            <input
              name="basePrice"
              type="text"
              inputMode="decimal"
              required
              defaultValue={defaultValues?.basePrice}
              placeholder="99.90"
              className={inputClass}
            />
          </Field>
          <Field label="Promoção (R$)" help="Opcional" error={fieldErrors?.salePrice?.[0]}>
            <input
              name="salePrice"
              type="text"
              inputMode="decimal"
              defaultValue={defaultValues?.salePrice}
              placeholder="79.90"
              className={inputClass}
            />
          </Field>
          <Field label="Custo (R$)" help="Interno, não aparece pra cliente" error={fieldErrors?.costPrice?.[0]}>
            <input
              name="costPrice"
              type="text"
              inputMode="decimal"
              defaultValue={defaultValues?.costPrice}
              placeholder="32.50"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Imagens">
        <ProductImagesEditor initial={defaultValues?.images ?? []} />
      </Section>

      <Section title="Publicação">
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
      </Section>

      <div className="border-line border-t pt-6">
        <button
          type="submit"
          disabled={pending}
          className="bg-orange rounded-md px-6 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
        >
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-ink-soft mb-4 text-xs uppercase tracking-widest">{title}</h2>
      <div className="space-y-4">{children}</div>
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
      <span className="text-ink text-sm">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
      {!error && help ? <p className="text-ink-faint mt-1 text-xs">{help}</p> : null}
    </label>
  );
}

const inputClass =
  "border-line focus:border-orange w-full rounded-md border bg-white px-3 py-2 text-sm outline-none";
