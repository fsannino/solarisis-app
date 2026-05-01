import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sem PrismaAdapter — Customer usa JWT puro. O signIn callback faz
  // upsert da linha em Customer; não temos Account/Session em DB pra
  // Customer (a tabela Customer já guarda email/name/cpf/phone etc).
  session: { strategy: "jwt" },
  basePath: "/api/auth",
  cookies: {
    sessionToken: {
      name: "solarisis.customer.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  pages: {
    signIn: "/conta/login"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Sempre pede o consentimento; útil enquanto estamos desenvolvendo.
      authorization: { params: { prompt: "select_account" } }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return false;

      // Upsert: cria Customer no primeiro login, atualiza name/image
      // se mudou no Google.
      await prisma.customer.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? "Cliente",
          image: user.image ?? null,
          emailVerified: new Date()
        },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined
        }
      });

      return true;
    },
    async jwt({ token, user }) {
      // Em login novo, busca o customerId via email. Em sessões
      // subsequentes, o id já está no token.
      if (user?.email && !token.customerId) {
        const customer = await prisma.customer.findUnique({
          where: { email: user.email },
          select: { id: true, segment: true }
        });
        if (customer) {
          token.customerId = customer.id;
          token.segment = customer.segment;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.customerId as string;
        session.user.segment = token.segment as string;
      }
      return session;
    }
  }
});
