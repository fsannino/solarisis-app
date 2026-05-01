# solarisis-app

Loja virtual + painel admin da **Solarisis** — moda solar FPS 50+ brasileira.

## Status

Fase 1 (MVP D2C) — bootstrap inicial. Veja roadmap em `CLAUDE.md`.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · Postgres

## Desenvolvimento

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Abrir <http://localhost:3000>.

## Especificação

Toda a especificação visual e de produto está em `fsannino/solarisis` na pasta
`design_handoff_solarisis/`:

- `README.md` — visão geral, modelo de dados, integrações, roadmap
- `SCHEMA.md` — telas e fluxos detalhados (loja + admin)
- `CLAUDE.md` — princípios de design e código (também copiado para a raiz aqui)

Protótipo navegável: <https://solarisis.vercel.app>
