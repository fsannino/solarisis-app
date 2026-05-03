import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth/admin";
import { deleteMediaAsset } from "@/lib/media";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.alt !== "string") {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: { alt: body.alt.trim() || null }
  });
  return NextResponse.json({ asset });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const removed = await deleteMediaAsset(id);
  if (!removed) {
    return NextResponse.json(
      { error: "Asset não encontrado." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
