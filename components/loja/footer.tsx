import Link from "next/link";

const COLUMNS = [
  {
    title: "Loja",
    links: [
      { href: "/loja?categoria=ADULTO", label: "Adulto" },
      { href: "/loja?categoria=INFANTIL", label: "Infantil" },
      { href: "/loja?categoria=ACESSORIO", label: "Acessórios" }
    ]
  },
  {
    title: "Solarisis",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/sustentabilidade", label: "Sustentabilidade" },
      { href: "/contato", label: "Contato" }
    ]
  },
  {
    title: "Ajuda",
    links: [
      { href: "/ajuda/trocas", label: "Trocas e devoluções" },
      { href: "/ajuda/entregas", label: "Prazos de entrega" },
      { href: "/ajuda/tamanhos", label: "Tabela de tamanhos" }
    ]
  }
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-30 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-4 md:px-8">
        <div>
          <p className="font-serif text-3xl italic text-ink">Solarisis</p>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">
            Moda solar FPS 50+ pra o sol todo dia. Praia, trilha, dia comum.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink transition-colors hover:text-orange"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-ink-faint md:flex-row md:items-center md:px-8">
          <p>© {year} Solarisis. Todos os direitos reservados.</p>
          <p>CNPJ em breve · Curitiba, PR</p>
        </div>
      </div>
    </footer>
  );
}
