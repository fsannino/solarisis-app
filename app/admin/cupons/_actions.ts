"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CouponType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Código curto demais")
      .max(40, "Código longo demais")
      .transform((s) => s.toUpperCase().replace(/\s+/g, "")),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Use formato 10 ou 10.00")
      .optional()
      .or(z.literal("")),
    minOrderValue: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Use formato 100 ou 100.00")
      .optional()
      .or(z.literal("")),
    maxUses: z
      .string()
      .trim()
      .regex(/^\d*$/, "Apenas números")
      .optional()
      .or(z.literal("")),
    perCustomerLimit: z
      .string()
      .trim()
      .regex(/^\d*$/, "Apenas números")
      .optional()
      .or(z.literal("")),
    validFrom: z.string().min(1, "Início obrigatório"),
    validUntil: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "paused", "expired"])
  })
  .refine(
    (d) =>
      d.type === "FREE_SHIPPING" ||
      (typeof d.value === "string" && d.value.length > 0),
    { message: "Valor obrigatório pra desconto", path: ["value"] }
  );

export type CouponFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parse(formData: FormData) {
  return couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value") ?? "",
    minOrderValue: formData.get("minOrderValue") ?? "",
    maxUses: formData.get("maxUses") ?? "",
    perCustomerLimit: formData.get("perCustomerLimit") ?? "",
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil") ?? "",
    status: formData.get("status")
  });
}

export async function createCoupon(
  _prev: CouponFormState | undefined,
  formData: FormData
): Promise<CouponFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }
  const data = parsed.data;

  const conflict = await prisma.coupon.findUnique({
    where: { code: data.code }
  });
  if (conflict) {
    return { ok: false, error: "Já existe cupom com esse código." };
  }

  const created = await prisma.coupon.create({
    data: {
      code: data.code,
      type: data.type as CouponType,
      value:
        data.type === "FREE_SHIPPING"
          ? "0"
          : (data.value as string),
      minOrderValue:
        data.minOrderValue && data.minOrderValue.length > 0
          ? data.minOrderValue
          : null,
      maxUses:
        data.maxUses && data.maxUses.length > 0
          ? Number(data.maxUses)
          : null,
      perCustomerLimit:
        data.perCustomerLimit && data.perCustomerLimit.length > 0
          ? Number(data.perCustomerLimit)
          : null,
      status: data.status,
      validFrom: new Date(data.validFrom),
      validUntil:
        data.validUntil && data.validUntil.length > 0
          ? new Date(data.validUntil)
          : null
    }
  });

  revalidatePath("/admin/cupons");
  redirect(`/admin/cupons/${created.id}`);
}

export async function updateCoupon(
  id: string,
  _prev: CouponFormState | undefined,
  formData: FormData
): Promise<CouponFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }
  const data = parsed.data;

  const conflict = await prisma.coupon.findFirst({
    where: { code: data.code, id: { not: id } }
  });
  if (conflict) {
    return { ok: false, error: "Já existe outro cupom com esse código." };
  }

  await prisma.coupon.update({
    where: { id },
    data: {
      code: data.code,
      type: data.type as CouponType,
      value:
        data.type === "FREE_SHIPPING"
          ? "0"
          : (data.value as string),
      minOrderValue:
        data.minOrderValue && data.minOrderValue.length > 0
          ? data.minOrderValue
          : null,
      maxUses:
        data.maxUses && data.maxUses.length > 0
          ? Number(data.maxUses)
          : null,
      perCustomerLimit:
        data.perCustomerLimit && data.perCustomerLimit.length > 0
          ? Number(data.perCustomerLimit)
          : null,
      status: data.status,
      validFrom: new Date(data.validFrom),
      validUntil:
        data.validUntil && data.validUntil.length > 0
          ? new Date(data.validUntil)
          : null
    }
  });

  revalidatePath("/admin/cupons");
  revalidatePath(`/admin/cupons/${id}`);
  return { ok: true };
}

export async function pauseCoupon(id: string) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { status: "paused" } });
  revalidatePath("/admin/cupons");
  revalidatePath(`/admin/cupons/${id}`);
}

export async function activateCoupon(id: string) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { status: "active" } });
  revalidatePath("/admin/cupons");
  revalidatePath(`/admin/cupons/${id}`);
}
