"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-helpers";
import { setSettings } from "@/lib/settings";

export type SettingsFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const brandSchema = z.object({
  brandName: z.string().trim().min(1, "Informe o nome").max(60),
  brandTagline: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d*$/, "Use só dígitos (ex: 5511999990000)")
    .max(20)
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._]*$/, "Sem @, só letras, números, ponto e _")
    .max(40)
    .optional()
    .or(z.literal(""))
});

const shippingSchema = z.object({
  freeShippingFrom: z.coerce.number().min(0).max(99999).default(0),
  originCep: z
    .string()
    .trim()
    .regex(/^(\d{5}-?\d{3})?$/, "CEP inválido (use 01310-100)")
    .optional()
    .or(z.literal(""))
});

const checkoutSchema = z.object({
  minOrderValue: z.coerce.number().min(0).max(99999).default(0)
});

const seoSchema = z.object({
  metaDescription: z.string().trim().max(180).optional().or(z.literal(""))
});

function flatten<T extends z.ZodType>(
  result: z.SafeParseError<z.infer<T>>
): Record<string, string[]> {
  return result.error.flatten().fieldErrors as Record<string, string[]>;
}

async function save<T extends z.ZodType>(
  schema: T,
  formData: FormData,
  fields: (keyof z.infer<T>)[]
): Promise<SettingsFormState> {
  const obj: Record<string, FormDataEntryValue | null> = {};
  for (const f of fields) obj[f as string] = formData.get(f as string);
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: flatten<T>(parsed)
    };
  }
  await setSettings(parsed.data as Record<string, unknown>);
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

export async function saveBrand(
  _prev: SettingsFormState | undefined,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();
  return save(brandSchema, formData, [
    "brandName",
    "brandTagline",
    "contactEmail",
    "contactPhone",
    "whatsapp",
    "instagram"
  ]);
}

export async function saveShipping(
  _prev: SettingsFormState | undefined,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();
  return save(shippingSchema, formData, ["freeShippingFrom", "originCep"]);
}

export async function saveCheckout(
  _prev: SettingsFormState | undefined,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();
  return save(checkoutSchema, formData, ["minOrderValue"]);
}

export async function saveSeo(
  _prev: SettingsFormState | undefined,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();
  return save(seoSchema, formData, ["metaDescription"]);
}
