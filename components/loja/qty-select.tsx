"use client";

import { useTransition } from "react";
import { updateCartItem } from "@/app/(loja)/_actions";

export function QtySelect({
  itemId,
  defaultQty,
  maxQty
}: {
  itemId: string;
  defaultQty: number;
  maxQty: number;
}) {
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", itemId);
      fd.set("quantity", value);
      await updateCartItem(fd);
    });
  }

  return (
    <select
      defaultValue={defaultQty}
      disabled={isPending}
      onChange={(e) => onChange(e.currentTarget.value)}
      className="cursor-pointer appearance-none rounded-full border border-line-strong bg-transparent py-1 pl-3 pr-7 text-[12px] font-semibold focus-visible:outline-none disabled:opacity-60"
    >
      {Array.from(
        { length: Math.max(1, Math.min(maxQty, 10)) },
        (_, n) => n + 1
      ).map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
