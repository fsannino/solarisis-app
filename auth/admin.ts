import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";

import { adminAuthConfig } from "./admin.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Auth.js completo do admin: importa o config Edge-safe e adiciona
// PrismaAdapter + Credentials.authorize com bcrypt (Node-only).
// O middleware (proxy.ts) usa apenas adminAuthConfig — não isso aqui.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...adminAuthConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            role: true,
            status: true
          }
        });

        if (!user || !user.passwordHash) return null;
        if (user.status !== "ACTIVE") return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        };
      }
    })
  ]
});
