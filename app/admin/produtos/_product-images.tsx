"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  MediaPicker,
  type MediaPickerSelection
} from "@/components/admin/media-picker";

export type ProductImageEntry = {
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export function ProductImagesEditor({
  initial = []
}: {
  initial?: ProductImageEntry[];
}) {
  const [images, setImages] = useState<ProductImageEntry[]>(() => {
    if (initial.length === 0) return [];
    if (initial.some((i) => i.isPrimary)) return initial;
    return initial.map((i, idx) => ({ ...i, isPrimary: idx === 0 }));
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function addImage(asset: MediaPickerSelection) {
    setImages((prev) => {
      if (prev.some((p) => p.url === asset.url)) return prev;
      const next = [
        ...prev,
        {
          url: asset.url,
          alt: asset.alt,
          isPrimary: prev.length === 0
        }
      ];
      return next;
    });
  }

  function removeAt(idx: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Se removeu a primária, primeira da lista vira primária.
      if (next.length > 0 && !next.some((p) => p.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  function setPrimary(idx: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === idx }))
    );
  }

  function setAlt(idx: number, alt: string) {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, alt } : img))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIdx = prev.findIndex((p) => p.url === active.id);
      const newIdx = prev.findIndex((p) => p.url === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(images)}
      />

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((i) => i.url)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {images.map((img, idx) => (
                <SortableImageCard
                  key={img.url}
                  image={img}
                  index={idx}
                  onRemove={() => removeAt(idx)}
                  onSetPrimary={() => setPrimary(idx)}
                  onSetAlt={(alt) => setAlt(idx, alt)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <MediaPicker
        excludeUrls={images.map((i) => i.url)}
        onSelect={addImage}
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-2 self-start rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-bone"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {images.length === 0 ? "Adicionar imagens" : "Adicionar mais"}
          </button>
        }
      />

      {images.length === 0 && (
        <p className="text-[12px] text-ink-faint">
          Nenhuma imagem ainda. Suba pela biblioteca ou cole arquivos no
          uploader.
        </p>
      )}
    </div>
  );
}

function SortableImageCard({
  image,
  index,
  onRemove,
  onSetPrimary,
  onSetAlt
}: {
  image: ProductImageEntry;
  index: number;
  onRemove: () => void;
  onSetPrimary: () => void;
  onSetAlt: (alt: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col gap-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-sand">
        <Image
          src={image.url}
          alt={image.alt ?? ""}
          fill
          sizes="(min-width: 1024px) 25vw, 33vw"
          className="object-cover"
        />

        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
          className="absolute left-2 top-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-bone/85 text-ink shadow-sm hover:bg-bone active:cursor-grabbing"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>

        {/* Estrela / primária */}
        <button
          type="button"
          onClick={onSetPrimary}
          aria-label={
            image.isPrimary ? "Imagem primária" : "Definir como primária"
          }
          title={image.isPrimary ? "Imagem primária" : "Definir como primária"}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md shadow-sm transition-colors ${
            image.isPrimary
              ? "bg-orange text-white"
              : "bg-bone/85 text-ink-soft hover:bg-bone hover:text-orange"
          }`}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill={image.isPrimary ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
            <polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9 12 2" />
          </svg>
        </button>

        {/* Remover */}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover"
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-bone/85 text-ink-soft shadow-sm hover:bg-destructive hover:text-destructive-foreground"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Posição */}
        <span className="absolute bottom-2 left-2 rounded-md bg-bone/85 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink shadow-sm">
          {index + 1}
        </span>
      </div>

      <input
        type="text"
        value={image.alt ?? ""}
        onChange={(e) => onSetAlt(e.target.value)}
        placeholder="Texto alternativo"
        className="rounded-md border border-line bg-bone px-2.5 py-1.5 text-[12px] focus-visible:border-ink focus-visible:outline-none"
      />
    </li>
  );
}
