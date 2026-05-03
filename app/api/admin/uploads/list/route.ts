import { NextResponse } from "next/server";

import { auth } from "@/auth/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json({ assets });
}
