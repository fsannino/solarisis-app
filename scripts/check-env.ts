/**
 * Verifica quais variáveis de ambiente estão configuradas.
 * Uso: `npm run check:env` (carrega .env automático via tsx).
 *
 * Não bloqueia startup — só informa. As "essenciais" são o mínimo
 * pro site receber e processar a primeira venda. As "opcionais"
 * habilitam features adicionais (frete real, NF-e, monitoramento).
 */

type Group = {
  title: string;
  vars: { name: string; hint?: string }[];
};

const ESSENTIALS: Group[] = [
  {
    title: "Banco de dados (Neon)",
    vars: [
      { name: "POSTGRES_PRISMA_URL", hint: "auto via Vercel/Neon Marketplace" },
      { name: "POSTGRES_URL_NON_POOLING", hint: "auto via Vercel/Neon Marketplace" }
    ]
  },
  {
    title: "Sessão",
    vars: [{ name: "AUTH_SECRET", hint: "openssl rand -base64 32" }]
  },
  {
    title: "Login do cliente (Google OAuth)",
    vars: [{ name: "AUTH_GOOGLE_ID" }, { name: "AUTH_GOOGLE_SECRET" }]
  },
  {
    title: "Pagamento (Mercado Pago)",
    vars: [
      { name: "MP_ACCESS_TOKEN" },
      { name: "MP_PUBLIC_KEY" },
      { name: "MP_WEBHOOK_SECRET", hint: "gerado pelo MP ao cadastrar webhook" }
    ]
  },
  {
    title: "Email transacional (Resend)",
    vars: [
      { name: "RESEND_API_KEY" },
      { name: "EMAIL_FROM", hint: 'ex: "Solarisis <pedidos@solarisis.com.br>"' }
    ]
  }
];

const OPTIONAL: Group[] = [
  {
    title: "Frete (Melhor Envio) — sem isso, vira frete fixo R$ 25",
    vars: [
      { name: "ME_TOKEN" },
      { name: "ME_FROM_CEP", hint: "CEP do galpão, só dígitos" },
      { name: "ME_SANDBOX", hint: '"true" pra testes' }
    ]
  },
  {
    title: "NF-e (Bling) — sem isso, emissão manual no portal Bling",
    vars: [
      { name: "BLING_CLIENT_ID" },
      { name: "BLING_CLIENT_SECRET" },
      { name: "BLING_REFRESH_TOKEN" },
      { name: "BLING_DEFAULT_NCM", hint: "default 61091000" },
      { name: "BLING_DEFAULT_CFOP", hint: "default 5102" }
    ]
  },
  {
    title: "Monitoramento (Sentry)",
    vars: [{ name: "SENTRY_DSN" }]
  },
  {
    title: "Atendimento (WhatsApp flutuante na loja)",
    vars: [
      {
        name: "NEXT_PUBLIC_WHATSAPP_NUMBER",
        hint: "DDI+DDD+numero, ex: 5511999999999"
      }
    ]
  }
];

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};

function isSet(name: string) {
  return Boolean(process.env[name] && process.env[name]!.trim().length > 0);
}

function printGroup(g: Group, isEssential: boolean) {
  console.log(`\n${ANSI.bold}${g.title}${ANSI.reset}`);
  for (const v of g.vars) {
    const ok = isSet(v.name);
    const tick = ok
      ? `${ANSI.green}✓${ANSI.reset}`
      : isEssential
        ? `${ANSI.red}✗${ANSI.reset}`
        : `${ANSI.yellow}–${ANSI.reset}`;
    const hint = v.hint ? ` ${ANSI.dim}(${v.hint})${ANSI.reset}` : "";
    console.log(`  ${tick} ${v.name}${hint}`);
  }
}

function summary() {
  const allEssentials = ESSENTIALS.flatMap((g) => g.vars.map((v) => v.name));
  const missing = allEssentials.filter((n) => !isSet(n));
  console.log("");
  if (missing.length === 0) {
    console.log(
      `${ANSI.green}${ANSI.bold}OK${ANSI.reset} — todas as essenciais estão configuradas. Pode subir.`
    );
  } else {
    console.log(
      `${ANSI.yellow}${ANSI.bold}Faltam ${missing.length} essencia${missing.length > 1 ? "is" : "l"}:${ANSI.reset} ${missing.join(", ")}`
    );
  }
}

console.log(`${ANSI.cyan}${ANSI.bold}Solarisis — check de env vars${ANSI.reset}`);
console.log(`${ANSI.dim}NODE_ENV=${process.env.NODE_ENV ?? "?"}${ANSI.reset}`);

console.log(`\n${ANSI.bold}${ANSI.cyan}Essenciais${ANSI.reset}`);
ESSENTIALS.forEach((g) => printGroup(g, true));

console.log(`\n${ANSI.bold}${ANSI.cyan}Opcionais${ANSI.reset}`);
OPTIONAL.forEach((g) => printGroup(g, false));

summary();
console.log("");
