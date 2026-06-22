import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const checks: Record<string, boolean> = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  };

  const allOk = Object.values(checks).every(Boolean);
  return NextResponse.json({ ok: allOk, checks });
}
