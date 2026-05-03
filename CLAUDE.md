# Solarisis — instruções para Claude Code

## O que é

Loja virtual de moda solar (FPU 50+) brasileira, marca Solarisis. Modelo D2C (loja própria) + multi-marketplace (Mercado Livre, Shopee, Amazon, Magalu).

## Stack

- **Front:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **DB:** Prisma + Postgres (Neon ou Supabase)
- **Auth:** Auth.js (NextAuth) ou Clerk
- **Pagamento:** Mercado Pago (Pix + cartão + boleto)
- **Frete:** Melhor Envio (Correios + transportadoras)
- **NF-e:** Bling ou Tiny ERP
- **Email:** Resend
- **Hospedagem:** Vercel (front) + Neon/Supabase (DB)

## Princípios de código

- Server Components por padrão; Client Components apenas quando precisar de estado/eventos.
- Validação com Zod em todo input externo (form, API, webhook).
- Erros tratados explicitamente — nunca silenciados.
- Testes em fluxos críticos: checkout, pagamento, emissão de NF-e, webhooks.
- Commits pequenos e descritivos.

## Princípios de design (preservar do protótipo)

### Paleta

```
--orange:       #FF7A00   /* primary, CTA */
--orange-soft:  #FFE8D2
--bg:           #FAF7F2   /* fundo geral */
--surface:      #FFFFFF
--line:         #E8DFD0
--line-strong:  #D4C7B0
--ink:          #1A1614
--ink-soft:     #6B5F54
--ink-faint:    #A89B8A
```

### Tipografia

- **Fraunces** (Google Fonts) — títulos, números grandes, itálicos com personalidade
- **Inter** (Google Fonts) — UI, corpo, formulários

### Tom

- Editorial, não techy — referências: Aritzia, Reserva, Osklen
- Laranja é acento, não inundação — usar com restrição em CTAs e estados ativos
- Sem gradientes agressivos — superfícies cremes e beges, fotografia carrega o calor
- PT-BR direto, sem corporativês: "Você", "Pedido", "Pagamento" — não "Cliente", "Order", "Payment"

### Layout

- **Loja:** mobile-first, denso em fotografia
- **Admin:** desktop-first, densidade Notion-like — informação clara sem ruído

## Não fazer

- Não usar emoji em UI (a menos que explicitamente pedido)
- Não inventar copy — perguntar ao Fabiano
- Não adicionar features fora do roadmap sem alinhamento
- Não copiar HTML do protótipo literalmente — recriar com Tailwind + shadcn
- Não usar gradientes coloridos genéricos
- Não usar fontes diferentes de Fraunces + Inter

## Sempre fazer

- Confirmar com o cliente antes de adicionar páginas/seções/features
- Validar cada mudança no protótipo de referência (`design_handoff_solarisis/`)
- Manter consistência com a paleta e tipografia
- Rodar `npm run lint` + `npm run typecheck` antes de commitar

## Referências

- Protótipo: <https://solarisis.vercel.app>
- Repo do protótipo / handoff: <https://github.com/fsannino/solarisis>
- Pasta de handoff: `design_handoff_solarisis/` no repo `fsannino/solarisis`
- Cliente: Fabiano Sannino (`@fsannino` no GitHub)

## Roadmap resumido

- **Fase 1 (4–6 sem):** MVP D2C — site público + checkout + admin básico + NF-e
- **Fase 2 (4 sem):** Cupons, devoluções, multi-galpão, relatórios
- **Fase 3 (4–6 sem):** Marketplaces via Bling, reviews, A/B
- **Fase 4:** App nativo, fidelidade, internacionalização
