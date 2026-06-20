import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = process.env.DATABASE_URL ?? "(not set)";
  const hasUrl = raw !== "(not set)" && raw.length > 10;

  if (!hasUrl) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    // Clean the URL the same way getDb() does
    const cleaned = raw
      .replace(/^postgresql:\/\//, "postgres://")
      .replace(/[?&](sslmode|channel_binding|options)=[^&]*/g, "")
      .replace(/[?&]$/, "");

    const { default: postgres } = await import("postgres");
    const sql = postgres(cleaned, { ssl: "require", max: 1, idle_timeout: 5, connect_timeout: 10 });

    const result = await sql`SELECT 1 AS ok`;
    await sql.end();

    return NextResponse.json({ ok: true, result: result[0], urlLength: raw.length, cleanedLength: cleaned.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg, urlLength: raw.length }, { status: 500 });
  }
}
