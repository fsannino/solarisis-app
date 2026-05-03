"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-helpers";
import { setVariantStock } from "@/lib/inventory";

const adjustSchema = z.object({
  variantId: z.string().min(1),
  newStock: z.coerce.number().int().min(0).max(99999),
  reason: z.string().trim().min(2).max(280)
});

export type StockAdjustResult =
  | { ok: true; newStock: number }
  | { ok: false; error: string };

export async function adjustStock(
  formData: FormData
): Promise<StockAdjustResult> {
  const session = await requireAdmin();
  const parsed = adjustSchema.safeParse({
    variantId: formData.get("variantId"),
    newStock: formData.get("newStock"),
    reason: formData.get("reason")
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos."
    };
  }

  try {
    const result = await setVariantStock({
      variantId: parsed.data.variantId,
      newStock: parsed.data.newStock,
      reason: parsed.data.reason,
      userId: session.user.id
    });
    revalidatePath("/admin/estoque");
    revalidatePath(`/admin/estoque/${parsed.data.variantId}`);
    revalidatePath("/admin/produtos");
    revalidatePath("/admin");
    return { ok: true, newStock: result.variant.stock };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao ajustar."
    };
  }
}
