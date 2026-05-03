/**
 * Gera slug URL-safe a partir de um texto livre.
 *  "Camiseta Praia FPU50+" -> "camiseta-praia-fps50"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove combining diacritical marks (acentos)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // tudo que não for alfanumérico vira hífen
    .replace(/^-+|-+$/g, "") // tira hífens das pontas
    .replace(/-{2,}/g, "-"); // colapsa duplicados
}
