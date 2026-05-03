import Image from "next/image";

type GalleryImage = { url: string; alt: string | null };

export function ProductGallery({
  images,
  productName
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const primary = images[0];
  if (!primary) {
    return (
      <div className="aspect-[4/5] w-full rounded-2xl bg-line" />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-line">
        <Image
          src={primary.url}
          alt={primary.alt ?? productName}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(1, 5).map((img) => (
            <div
              key={img.url}
              className="relative aspect-square overflow-hidden rounded-lg bg-line"
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
