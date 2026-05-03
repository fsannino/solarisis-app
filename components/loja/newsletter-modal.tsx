"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";

const SESSION_KEY = "solarisis_newsletter_seen";
const AUTO_OPEN_DELAY_MS = 4500;
export const NEWSLETTER_OPEN_EVENT = "solarisis:open-newsletter";

export function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  // Auto-popup uma vez por sessão
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    const t = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Listener pra abrir manualmente (botão "Quero entrar" do banner)
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(NEWSLETTER_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(NEWSLETTER_OPEN_EVENT, onOpen);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) return;
    // Sem backend de newsletter ainda — só simulação visual.
    // Quando integrar Resend audiences ou Mailchimp, chamar aqui.
    setDone(true);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-bone p-0 sm:max-w-[480px]"
      >
        <div className="flex flex-1 flex-col justify-center px-10 py-12">
          {!done ? (
            <>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-orange text-white">
                <SunIcon />
              </div>
              <SheetTitle className="display text-[40px] leading-none">
                Entre na{" "}
                <em className="not-italic italic text-orange">brisa</em>.
              </SheetTitle>
              <SheetDescription className="mt-3 text-[15px] leading-[1.55]">
                Receba primeiro os lançamentos, editoriais e{" "}
                <strong className="text-ink">10% off</strong> na primeira
                compra.
              </SheetDescription>

              <form onSubmit={handleSubmit} className="mt-7 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 flex-1 rounded-full border border-line-strong bg-transparent px-5 text-[14px] text-ink placeholder:text-ink-faint focus-visible:border-ink focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink"
                >
                  Entrar
                </button>
              </form>

              <p className="eyebrow mt-5 text-[10px]">Sem spam. Só sol.</p>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-3 text-5xl">☀️</div>
              <SheetTitle className="display text-[32px]">
                Bem-vindo ao verão eterno.
              </SheetTitle>
              <SheetDescription className="mt-3 text-[15px] leading-[1.55]">
                Confira sua caixa de entrada — seu cupom já está a caminho.
              </SheetDescription>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function openNewsletter() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT));
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </svg>
  );
}
