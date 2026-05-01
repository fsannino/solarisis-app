import { DefaultSession } from "next-auth";

// Tipos compartilhados entre as duas instâncias de Auth.js
// (admin em auth/admin.ts, customer em auth/customer.ts).
// Campos são opcionais porque cada instância usa um subset.

declare module "next-auth" {
  interface User {
    role?: string;
    segment?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: string; // admin
      segment?: string; // customer
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string; // admin: User.id
    customerId?: string; // customer: Customer.id
    role?: string; // admin
    segment?: string; // customer
  }
}
