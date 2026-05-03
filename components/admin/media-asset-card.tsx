"use client";

import Image from "next/image";

import type { UploadedAsset } from "./media-uploader";

export function MediaAssetCard({
  asset,
  selected,
  onSelect,
  selectable = true
}: {
  asset: UploadedAsset;
  selected?: boolean;
  onSelect?: (asset: UploadedAsset) => void;
  selectable?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(asset)}
      disabled={!selectable && !onSelect}
      className={`group relative aspect-square overflow-hidden rounded-md border bg-sand text-left transition-all ${
        selected
          ? "border-orange ring-2 ring-orange ring-offset-2 ring-offset-bone"
          : "border-line hover:border-ink"
      }`}
    >
      <Image
        src={asset.url}
        alt={asset.alt ?? asset.filename ?? ""}
        fill
        sizes="(min-width: 1024px) 16vw, 25vw"
        className="object-cover"
      />
      {selected && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange text-white shadow-sm">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
      )}
    </button>
  );
}
