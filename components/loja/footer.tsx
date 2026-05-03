import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    title: "Loja",
    links: [
      { href: "/loja?categoria=ADULTO", label: "Adulto" },
      { href: "/loja?categoria=INFANTIL", label: "Infantil" },
      { href: "/colecoes", label: "Coleções" },
      { href: "/lookbook", label: "Lookbook" }
    ]
  },
  {
    title: "Solarisis",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/diario", label: "Diário" },
      { href: "/tecnologia", label: "Tecnologia FPU" },
      { href: "/sustentabilidade", label: "Sustentabilidade" }
    ]
  },
  {
    title: "Cuide",
    links: [
      { href: "/ajuda/trocas", label: "Trocas e devoluções" },
      { href: "/ajuda/atendimento", label: "Atendimento" },
      { href: "/ajuda/whatsapp", label: "WhatsApp" },
      {
        href: "https://instagram.com/solarisismoda",
        label: "@solarisismoda",
        external: true
      }
    ]
  }
];

export function Footer() {
  return (
    <footer className="mt-30 bg-ink py-20 text-bone">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/assets/solarisis-logo-vertical-transparent.png"
              alt="Solarisis"
              width={200}
              height={120}
              className="mb-6 h-auto w-[180px]"
            />
            <p className="font-serif text-[36px] font-light italic leading-[1] tracking-tight md:text-[48px]">
              Seu sol,
              <br />
              <em className="not-italic text-orange">seu jeito.</em>
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/55">
              solarisis.com.br · Brasil · @solarisismoda
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-bone/55">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={"external" in link && link.external ? "_blank" : undefined}
                      rel={"external" in link && link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-bone/85 transition-colors hover:text-orange"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-15 flex flex-col items-start justify-between gap-3 border-t border-bone/15 pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-bone/55 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Solarisis Moda Praia</span>
          <div className="flex items-center gap-5">
            <Link
              href="https://instagram.com/solarisismoda"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-bone/85 transition-colors hover:text-orange"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </Link>
            <Link
              href="/admin"
              className="text-bone/40 underline-offset-4 hover:text-bone hover:underline"
            >
              Painel admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
