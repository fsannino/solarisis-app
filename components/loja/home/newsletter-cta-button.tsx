"use client";

import { openNewsletter } from "@/components/loja/newsletter-modal";

export function NewsletterCtaButton() {
  return (
    <button
      type="button"
      onClick={openNewsletter}
      className="inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bone hover:text-ink"
    >
      Quero entrar
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
