import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/config";

function validateAdminRequest(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_TOKEN;
  return !!(adminToken && token === adminToken);
}

export async function GET(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const cfg = await getConfig();
  return NextResponse.json(cfg);
}

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  await saveConfig(body);
  return NextResponse.json({ ok: true });
}
