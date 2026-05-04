import { prisma } from "@/lib/db";

export type StoreSettings = {
  brandName: string;
  brandTagline: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  instagram: string;
  freeShippingFrom: number; // BRL, 0 = desativado
  originCep: string;
  minOrderValue: number; // BRL, 0 = sem mínimo
  metaDescription: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  brandName: "Solarisis",
  brandTagline: "Moda com proteção solar",
  contactEmail: "ola@solarisis.com.br",
  contactPhone: "(11) 99999-0000",
  whatsapp: "5511999990000",
  instagram: "solarisis.br",
  freeShippingFrom: 399,
  originCep: "01310-100",
  minOrderValue: 0,
  metaDescription:
    "Roupas com proteção UV FPU 50+ feitas no Brasil. Cortes fluidos, estampas vibrantes e tecidos que respiram."
};

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof StoreSettings)[];

function parseValue(key: keyof StoreSettings, value: string): unknown {
  if (key === "freeShippingFrom" || key === "minOrderValue") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return value;
}

function stringifyValue(v: unknown): string {
  if (typeof v === "number") return String(v);
  return String(v ?? "");
}

export async function getSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: KEYS as string[] } }
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULT_SETTINGS };
  for (const key of KEYS) {
    if (map[key] !== undefined) {
      (result as Record<string, unknown>)[key] = parseValue(key, map[key]);
    }
  }
  return result;
}

export async function setSettings(
  patch: Partial<StoreSettings>
): Promise<void> {
  const ops = Object.entries(patch).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value: stringifyValue(value) },
      create: { key, value: stringifyValue(value) }
    })
  );
  await prisma.$transaction(ops);
}
