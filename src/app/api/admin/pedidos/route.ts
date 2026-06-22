import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const offset = Number(searchParams.get("offset") || "0");
  const limit = Math.min(Number(searchParams.get("limit") || "24"), 200);
  const nome = searchParams.get("nome")?.trim() || "";
  const fone = searchParams.get("fone")?.trim() || "";
  const date = searchParams.get("date") || "all";

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const nomeFilter = nome ? sql`AND p.nome ILIKE ${"%" + nome + "%"}` : sql``;
  const foneFilter = fone
    ? sql`AND (p.telefone ILIKE ${"%" + fone + "%"} OR p.email ILIKE ${"%" + fone + "%"})`
    : sql``;
  const dateFilter =
    date === "today"
      ? sql`AND p.created_at >= ${today}`
      : date === "yesterday"
      ? sql`AND p.created_at >= ${yesterday} AND p.created_at < ${today}`
      : sql``;

  const pedidos = await sql`
    SELECT
      p.id, p.nome, p.clube, p.telefone, p.sticker_url, p.preview_url,
      p.sticker_id, p.status, p.created_at,
      (SELECT SUM(pi.price) FROM pedido_items pi WHERE pi.email = p.email AND pi.status != 'pendente') AS price_paid
    FROM pedidos p
    WHERE 1=1 ${nomeFilter} ${foneFilter} ${dateFilter}
    ORDER BY p.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await sql`
    SELECT COUNT(*)::int AS total
    FROM pedidos p
    WHERE 1=1 ${nomeFilter} ${foneFilter} ${dateFilter}
  `;

  return NextResponse.json({
    pedidos,
    totalFiltered: countResult[0].total,
  });
}

export async function DELETE(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (email === "all") {
    await sql`DELETE FROM pedidos`;
    return NextResponse.json({ ok: true, message: "Todos os pedidos removidos" });
  }

  if (email) {
    await sql`DELETE FROM pedidos WHERE email = ${email}`;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Parâmetro email obrigatório" }, { status: 400 });
}
