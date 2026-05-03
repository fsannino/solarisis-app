"use client";

import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { MediaUploader, type UploadedAsset } from "./media-uploader";
import { MediaAssetCard } from "./media-asset-card";

export type MediaPickerSelection = UploadedAsset;

/**
 * Trigger button + drawer com biblioteca + upload.
 * Usado dentro de forms (produto, banner, etc) pra escolher
 * uma ou várias imagens.
 */
export function MediaPicker({
  trigger,
  onSelect,
  excludeUrls = []
}: {
  trigger: React.ReactNode;
  onSelect: (asset: MediaPickerSelection) => void;
  /** URLs já escolhidas — destacadas visualmente */
  excludeUrls?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/admin/uploads/list")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setAssets(data.assets ?? []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleUploaded(asset: UploadedAsset) {
    setAssets((prev) => [asset, ...prev]);
    setTab("library");
  }

  function pick(asset: UploadedAsset) {
    onSelect(asset);
    setOpen(false);
  }

  const filtered = search
    ? assets.filter(
        (a) =>
          (a.alt ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (a.filename ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <SheetContent
        side="right"
        className="flex w-full flex-col bg-bone p-0 sm:max-w-[640px]"
      >
        <SheetHeader>
          <SheetTitle>Biblioteca de mídia</SheetTitle>
        </SheetHeader>

        <div className="flex border-b border-line px-6">
          {(["library", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                tab === t
                  ? "border-orange text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t === "library" ? "Da biblioteca" : "Subir nova"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "library" ? (
            <div className="flex flex-col gap-4">
              <input
                type="search"
                placeholder="Buscar por nome ou alt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-md border border-line bg-surface px-3 text-[13px] focus-visible:border-ink focus-visible:outline-none"
              />
              {!loaded ? (
                <p className="py-8 text-center text-[13px] text-ink-soft">
                  Carregando…
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-ink-soft">
                  {search
                    ? "Nada com esse termo."
                    : "Biblioteca vazia. Suba a primeira imagem."}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4">
                  {filtered.map((a) => (
                    <MediaAssetCard
                      key={a.id}
                      asset={a}
                      selected={excludeUrls.includes(a.url)}
                      onSelect={pick}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <MediaUploader onUploaded={handleUploaded} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
