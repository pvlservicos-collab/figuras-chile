import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!sql) {
    const raw = (process.env.DATABASE_URL ?? "").trim();
    // postgres.js requires the 'postgres://' scheme (not 'postgresql://')
    // and does not understand sslmode/channel_binding query params — strip them
    const cleaned = raw
      .replace(/^postgresql:\/\//, "postgres://")
      .replace(/[?&](sslmode|channel_binding|options)=[^&]*/g, "")
      .replace(/[?&]$/, "");
    sql = postgres(cleaned, { ssl: "require", max: 5 });
  }
  return sql;
}
