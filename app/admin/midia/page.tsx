import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

import { MediaLibrary } from "./media-library";

export default async function MidiaPage() {
  await requireAdmin();

  const [assets, totalCount, totalSize] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    prisma.mediaAsset.count(),
    prisma.mediaAsset.aggregate({ _sum: { sizeBytes: true } })
  ]);

  const totalBytes = totalSize._sum.sizeBytes ?? 0;
  const totalMB = (totalBytes / 1024 / 1024).toFixed(1);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-3 text-[clamp(28px,3vw,36px)]">
            Biblioteca de mídia
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {totalCount} {totalCount === 1 ? "imagem" : "imagens"} · {totalMB} MB
          </p>
        </div>
      </header>

      <MediaLibrary
        initial={assets.map((a) => ({
          id: a.id,
          url: a.url,
          alt: a.alt,
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          width: a.width,
          height: a.height,
          createdAt: a.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
