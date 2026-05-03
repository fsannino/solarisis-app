import { put, del } from "@vercel/blob";

import { prisma } from "@/lib/db";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Faz upload de um File pro Vercel Blob e cria o registro MediaAsset.
 *
 * Pra rodar em produção: criar Blob store no Vercel Dashboard
 * (Storage → Create → Blob), o token BLOB_READ_WRITE_TOKEN é
 * auto-injetado.
 */
export async function uploadMediaAsset(input: {
  file: File;
  alt?: string;
  uploadedById?: string;
}) {
  const { file, alt, uploadedById } = input;

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Tipo de arquivo não suportado: ${file.type}. Aceitos: JPEG, PNG, WebP, AVIF.`
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 10 MB.`
    );
  }
  if (!blobEnabled()) {
    throw new Error(
      "Vercel Blob não configurado. Crie a Blob store no dashboard."
    );
  }

  // Nome com timestamp + slug do nome original — evita colisão.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "image";
  const pathname = `solarisis/${Date.now()}-${baseName}${ext ? "." + ext : ""}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false
  });

  // Lê dimensões da imagem via image-size puro (sem dep nova): pulamos por
  // simplicidade. O <Image> do Next mede sob demanda; width/height ficam
  // null aqui e podem ser preenchidos futuramente com sharp/probe-image-size.
  const asset = await prisma.mediaAsset.create({
    data: {
      url: blob.url,
      pathname,
      alt: alt ?? null,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      createdById: uploadedById ?? null
    }
  });

  return asset;
}

export async function deleteMediaAsset(id: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return null;

  if (asset.pathname && blobEnabled()) {
    try {
      await del(asset.pathname);
    } catch (err) {
      console.error("[media] erro ao deletar do blob:", err);
      // Continuamos pra deletar do DB mesmo assim — o blob pode ser
      // limpo manualmente ou ficar órfão.
    }
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return asset;
}
