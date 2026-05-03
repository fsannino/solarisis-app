import Link from "next/link";

export function ComingSoon({
  eyebrow,
  title,
  description,
  cta = { href: "/loja", label: "Ir pra loja" }
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  cta?: { href: string; label: string };
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[900px] flex-col justify-center px-4 py-20 md:px-8 md:py-28">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-4 text-[clamp(48px,7vw,96px)]">{title}</h1>
      <p className="mt-6 max-w-[560px] text-[17px] leading-[1.6] text-ink-soft">
        {description}
      </p>
      <div className="mt-10">
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone transition-all hover:-translate-y-0.5 hover:bg-orange"
        >
          {cta.label}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
