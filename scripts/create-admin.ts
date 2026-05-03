/**
 * Cria (ou atualiza) o primeiro usuário admin sem precisar do Prisma Studio.
 * Uso:
 *   npm run admin:create -- email@solarisis.com.br "Senha forte"
 *
 * Aceita um terceiro argumento opcional pro nome:
 *   npm run admin:create -- email@solarisis.com.br "Senha forte" "Fabiano"
 *
 * Se o email já existe, atualiza a senha — útil pra resetar.
 */

import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [emailArg, passwordArg, nameArg] = process.argv.slice(2);

  if (!emailArg || !passwordArg) {
    console.error(
      "Uso: npm run admin:create -- email@dominio.com 'SenhaForte' [nome]"
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const password = passwordArg;
  const name = nameArg?.trim() || email.split("@")[0];

  if (password.length < 8) {
    console.error("A senha precisa ter ao menos 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        status: UserStatus.ACTIVE
      }
    });
    console.log(`✓ Senha atualizada para ${email} (${existing.role}).`);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE
      }
    });
    console.log(`✓ Admin criado: ${created.email} (${created.role}).`);
    console.log(`  Login em /admin/login`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
