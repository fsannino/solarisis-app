import { prisma } from "@/lib/db";

/**
 * Gera o próximo número de pedido no formato `2026-00001`.
 *
 * Usa COUNT por ano + 1. Existe race condition em alta concorrência —
 * pra MVP é aceitável; quando precisar, trocar por sequência Postgres
 * (`CREATE SEQUENCE order_number_2026 ...`) ou por advisory lock.
 */
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { number: { startsWith: `${year}-` } }
  });
  const seq = String(count + 1).padStart(5, "0");
  return `${year}-${seq}`;
}
