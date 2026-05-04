// Build orquestrado pra Vercel.
// - Em produção: roda `prisma migrate deploy` antes do `next build`.
// - Em preview/dev: pula migrate deploy (cada branch do Vercel pode
//   apontar pra um DB Neon diferente sem histórico de migrations,
//   o que faz `migrate deploy` falhar com P3005).

import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV ?? "development";

if (env === "production") {
  console.log("[build] VERCEL_ENV=production — aplicando migrations…");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log(`[build] VERCEL_ENV=${env} — pulando prisma migrate deploy.`);
}

execSync("npx next build", { stdio: "inherit" });
