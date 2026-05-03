import { MovementType } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Garante que existe um warehouse padrão pra registrar movimentações.
 * Pra MVP sem multi-galpão, todo movimento vai pro "Galpão Solarisis".
 * Quando entrar a feature de multi-galpão, o admin escolhe qual.
 */
export async function getOrCreateDefaultWarehouse() {
  const existing = await prisma.warehouse.findFirst({
    where: { isPrimary: true }
  });
  if (existing) return existing;

  const any = await prisma.warehouse.findFirst();
  if (any) return any;

  return prisma.warehouse.create({
    data: {
      name: "Galpão Solarisis",
      cep: process.env.ME_FROM_CEP ?? "00000000",
      address: "Endereço não informado",
      isPrimary: true,
      status: "active"
    }
  });
}

/**
 * Define o estoque de uma variante pra um valor absoluto.
 * Calcula o delta vs estoque atual e registra como InventoryMovement
 * (IN se positivo, OUT se negativo, ADJUSTMENT se a flag for passada).
 *
 * Tudo numa transação pra evitar inconsistência.
 */
export async function setVariantStock(input: {
  variantId: string;
  newStock: number;
  reason: string;
  userId?: string;
  movementType?: MovementType;
}) {
  const { variantId, newStock, reason, userId } = input;
  if (newStock < 0) {
    throw new Error("Estoque não pode ser negativo.");
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stock: true }
  });
  if (!variant) {
    throw new Error("Variante não encontrada.");
  }

  const delta = newStock - variant.stock;
  if (delta === 0) {
    return { variant, movement: null };
  }

  const warehouse = await getOrCreateDefaultWarehouse();

  const movementType: MovementType =
    input.movementType ??
    (delta > 0 ? MovementType.IN : MovementType.OUT);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
      select: { id: true, stock: true }
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        variantId,
        warehouseId: warehouse.id,
        type: movementType,
        quantity: Math.abs(delta),
        reason,
        createdById: userId ?? null
      }
    });

    return { variant: updated, movement };
  });

  return result;
}
