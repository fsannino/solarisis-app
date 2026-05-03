"use client";

import { useState } from "react";

export type UploadedAsset = {
  id: string;
  url: string;
  alt: string | null;
  filename: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export function MediaUploader({
  onUploaded,
  className
}: {
  onUploaded: (asset: UploadedAsset) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          body: fd
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Falha no upload.");
        }
        onUploaded(data.asset as UploadedAsset);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
          uploadFiles(e.dataTransfer.files);
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragOver
          ? "border-orange bg-orange-soft/40"
          : "border-line-strong bg-surface hover:border-ink hover:bg-sand/40"
      } ${className ?? ""}`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <path d="M17 8l-5-5-5 5" />
        <path d="M12 3v12" />
      </svg>
      {busy ? (
        <p className="text-[13px] font-medium text-orange">Enviando…</p>
      ) : (
        <>
          <p className="text-[13px] font-medium text-ink">
            Clique pra subir ou arraste arquivos aqui
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            JPEG · PNG · WebP · AVIF · até 10 MB
          </p>
        </>
      )}
      {error && (
        <p className="mt-2 text-[12px] text-destructive">{error}</p>
      )}
    </label>
  );
}
