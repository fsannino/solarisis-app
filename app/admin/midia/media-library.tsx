"use client";

import { useState } from "react";
import Image from "next/image";

import {
  MediaUploader,
  type UploadedAsset
} from "@/components/admin/media-uploader";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({ initial }: { initial: UploadedAsset[] }) {
  const [assets, setAssets] = useState<UploadedAsset[]>(initial);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UploadedAsset | null>(null);
  const [editingAlt, setEditingAlt] = useState("");
  const [busy, setBusy] = useState(false);

  function handleUploaded(asset: UploadedAsset) {
    setAssets((prev) => [asset, ...prev]);
  }

  function handleSelect(asset: UploadedAsset) {
    setSelected(asset);
    setEditingAlt(asset.alt ?? "");
  }

  async function handleSaveAlt() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/uploads/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: editingAlt })
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...selected, alt: editingAlt };
        setSelected(updated);
        setAssets((prev) =>
          prev.map((a) => (a.id === selected.id ? updated : a))
        );
      } else {
        alert(data.error ?? "Falha ao salvar alt.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm("Apagar essa imagem? Não pode ser desfeito.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/uploads/${selected.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== selected.id));
        setSelected(null);
      } else {
        const data = await res.json();
        alert(data.error ?? "Falha ao deletar.");
      }
    } finally {
      setBusy(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  const filtered = search
    ? assets.filter(
        (a) =>
          (a.alt ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (a.filename ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        <MediaUploader onUploaded={handleUploaded} />

        <input
          type="search"
          placeholder="Buscar por nome ou alt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-md border border-line bg-surface px-3 text-[13px] focus-visible:border-ink focus-visible:outline-none"
        />

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
            <p className="display text-[20px]">
              {search
                ? "Nada com esse termo."
                : "Biblioteca vazia ainda."}
            </p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {search ? "Tente outra busca." : "Suba a primeira imagem acima."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 xl:grid-cols-5">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleSelect(a)}
                className={`relative aspect-square overflow-hidden rounded-md border bg-sand transition-all ${
                  selected?.id === a.id
                    ? "border-orange ring-2 ring-orange ring-offset-2 ring-offset-bone"
                    : "border-line hover:border-ink"
                }`}
              >
                <Image
                  src={a.url}
                  alt={a.alt ?? a.filename ?? ""}
                  fill
                  sizes="(min-width: 1024px) 16vw, 25vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Painel lateral de detalhe */}
      <aside className="self-start rounded-lg border border-line bg-surface p-5">
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/5] overflow-hidden bg-sand">
              <Image
                src={selected.url}
                alt={selected.alt ?? ""}
                fill
                sizes="360px"
                className="object-contain"
              />
            </div>

            <div>
              <label className="eyebrow text-[10px]">
                Texto alternativo
              </label>
              <textarea
                value={editingAlt}
                onChange={(e) => setEditingAlt(e.target.value)}
                rows={2}
                placeholder="Descreva a imagem (acessibilidade)"
                className="mt-2 w-full rounded-md border border-line bg-bone px-3 py-2 text-[13px] focus-visible:border-ink focus-visible:outline-none"
              />
              {editingAlt !== (selected.alt ?? "") && (
                <button
                  type="button"
                  onClick={handleSaveAlt}
                  disabled={busy}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange disabled:opacity-50"
                >
                  Salvar
                </button>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-4 text-[12px]">
              {selected.filename && (
                <>
                  <dt className="text-ink-soft">Arquivo</dt>
                  <dd className="truncate text-ink" title={selected.filename}>
                    {selected.filename}
                  </dd>
                </>
              )}
              <dt className="text-ink-soft">Tamanho</dt>
              <dd className="text-ink">{formatBytes(selected.sizeBytes)}</dd>
              <dt className="text-ink-soft">Tipo</dt>
              <dd className="text-ink">{selected.mimeType}</dd>
              {selected.width && selected.height && (
                <>
                  <dt className="text-ink-soft">Dimensões</dt>
                  <dd className="text-ink">
                    {selected.width} × {selected.height}
                  </dd>
                </>
              )}
            </dl>

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => copyUrl(selected.url)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-4 py-2 text-[12px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone"
              >
                Copiar URL
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/50 px-4 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
              >
                Apagar imagem
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="eyebrow mb-3">Detalhe</p>
            <p className="text-[13px] text-ink-soft">
              Selecione uma imagem pra ver detalhes, editar o alt ou apagar.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
