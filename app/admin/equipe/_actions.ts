"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export type TeamFormState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type TeamActionResult = { ok: true } | { ok: false; error: string };

const ROLES = [
  "OWNER",
  "ADMIN",
  "STOCK",
  "SUPPORT",
  "MARKETING",
  "STAFF"
] as const satisfies readonly UserRole[];

const STATUSES = [
  "ACTIVE",
  "INVITED",
  "SUSPENDED"
] as const satisfies readonly UserStatus[];

const createSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(ROLES),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(80)
});

const updateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  role: z.enum(ROLES),
  status: z.enum(STATUSES),
  password: z
    .string()
    .max(80)
    .optional()
    .or(z.literal(""))
});

export async function createTeamMember(
  _prev: TeamFormState | undefined,
  formData: FormData
): Promise<TeamFormState> {
  const session = await requireAdmin();
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return { ok: false, error: "Sem permissão pra adicionar membros." };
  }

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  // Só OWNER pode promover outro OWNER
  if (parsed.data.role === "OWNER" && session.user.role !== "OWNER") {
    return { ok: false, error: "Só OWNER pode criar outro OWNER." };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true }
  });
  if (exists) {
    return { ok: false, error: "Já existe usuário com esse e-mail." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      status: "ACTIVE",
      passwordHash
    }
  });

  revalidatePath("/admin/equipe");
  redirect(`/admin/equipe/${created.id}`);
}

export async function updateTeamMember(
  id: string,
  _prev: TeamFormState | undefined,
  formData: FormData
): Promise<TeamFormState> {
  const session = await requireAdmin();
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return { ok: false, error: "Sem permissão pra editar membros." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true }
  });
  if (!target) return { ok: false, error: "Usuário não encontrado." };

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    status: formData.get("status"),
    password: formData.get("password") ?? ""
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  // Regras de permissão
  if (
    (target.role === "OWNER" || parsed.data.role === "OWNER") &&
    session.user.role !== "OWNER"
  ) {
    return {
      ok: false,
      error: "Só OWNER pode promover/rebaixar outro OWNER."
    };
  }
  if (target.role === "OWNER" && parsed.data.role !== "OWNER") {
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) {
      return { ok: false, error: "Não pode rebaixar o último OWNER." };
    }
  }

  const data: {
    name: string;
    role: UserRole;
    status: UserStatus;
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    role: parsed.data.role,
    status: parsed.data.status
  };
  if (parsed.data.password && parsed.data.password.length > 0) {
    if (parsed.data.password.length < 8) {
      return {
        ok: false,
        error: "Senha precisa ter pelo menos 8 caracteres.",
        fieldErrors: { password: ["Mínimo 8 caracteres."] }
      };
    }
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  await prisma.user.update({ where: { id }, data });

  revalidatePath("/admin/equipe");
  revalidatePath(`/admin/equipe/${id}`);
  return { ok: true };
}

export async function deleteTeamMember(id: string): Promise<TeamActionResult> {
  const session = await requireAdmin();
  if (session.user.role !== "OWNER") {
    return { ok: false, error: "Só OWNER pode excluir membros." };
  }
  if (!id) return { ok: false, error: "ID inválido." };
  if (id === session.user.id) {
    return { ok: false, error: "Você não pode excluir a si mesmo." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true }
  });
  if (!target) return { ok: false, error: "Usuário não encontrado." };
  if (target.role === "OWNER") {
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) {
      return { ok: false, error: "Não pode excluir o último OWNER." };
    }
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe");
}
