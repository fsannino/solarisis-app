import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth/admin";
import { uploadMediaAsset, blobEnabled } from "@/lib/media";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!blobEnabled()) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob não está configurado. Crie a Blob store no Vercel Dashboard pra ativar uploads."
      },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 });
  }
  const file = form.get("file");
  const alt = form.get("alt");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo 'file' ausente ou inválido." },
      { status: 400 }
    );
  }

  try {
    const asset = await uploadMediaAsset({
      file,
      alt: typeof alt === "string" && alt.trim().length > 0 ? alt.trim() : undefined,
      uploadedById: session.user.id
    });
    return NextResponse.json({ asset });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Falha no upload."
      },
      { status: 400 }
    );
  }
}
