"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";

export function CartDrawer({
  count,
  children
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Sacola (${count} itens)`}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-bone transition-colors hover:bg-orange md:gap-2.5 md:pl-4 md:pr-4"
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
          <span className="hidden md:inline">Sacola</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1.5 text-[11px] font-bold text-white">
            {count}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-bone p-0 sm:max-w-[440px]"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
