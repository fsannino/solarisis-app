import type { NextAuthConfig } from "next-auth";

// Config compartilhada entre o middleware (Edge runtime) e o
// handler completo do Auth.js (auth/admin.ts, com Prisma).
// MUITO IMPORTANTE: este arquivo NÃO pode importar @prisma/client
// nem nada Node-only — ele é carregado pelo proxy.ts no Edge.

export const adminAuthConfig = {
  session: { strategy: "jwt" },
  basePath: "/admin/api/auth",
  cookies: {
    sessionToken: {
      name: "solarisis.admin.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  pages: {
    signIn: "/admin/login"
  },
  // Providers vão sem authorize aqui — o auth/admin.ts adiciona
  // o Credentials completo (com Prisma) por cima. O middleware
  // só precisa validar/decodificar o JWT, não autenticar.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
