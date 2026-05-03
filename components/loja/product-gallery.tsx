import Image from "next/image";

export type GalleryImage = { url: string; alt: string | null };

const FILLER_IMAGES = [
  { url: "/assets/photos/lifestyle-06.jpg", alt: "Detalhe do tecido" },
  { url: "/assets/photos/lifestyle-05.jpg", alt: "Lifestyle" },
  { url: "/assets/photos/lifestyle-02.jpg", alt: "Editorial" }
];

export function ProductGallery({
  images,
  productName
}: {
  images: GalleryImage[];
  productName: string;
}) {
  // Layout do design: imagem principal grande (span 2) + 2 thumbs lado a lado +
  // imagem editorial larga embaixo. Se faltarem fotos no produto, usa imagens
  // de lifestyle como filler — substituir quando o admin de imagens entrar.
  const primary = images[0] ?? null;
  const second = images[1] ?? FILLER_IMAGES[0];
  const third = images[2] ?? FILLER_IMAGES[1];
  const fourth = images[3] ?? FILLER_IMAGES[2];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="relative col-span-2 aspect-[4/5] overflow-hidden bg-sand">
        {primary && (
          <Image
            src={primary.url}
            alt={primary.alt ?? productName}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="relative aspect-square overflow-hidden bg-sand">
        <Image
          src={second.url}
          alt={second.alt ?? productName}
          fill
          sizes="(min-width: 1024px) 30vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="relative aspect-square overflow-hidden bg-sand">
        <Image
          src={third.url}
          alt={third.alt ?? productName}
          fill
          sizes="(min-width: 1024px) 30vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="relative col-span-2 aspect-[3/2] overflow-hidden bg-sand">
        <Image
          src={fourth.url}
          alt={fourth.alt ?? productName}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
