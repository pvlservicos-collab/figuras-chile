import { getDb } from "@/lib/db";

export interface SiteConfig {
  locale: string;
  currency: string;
  price: string;
  checkoutUrl: string;
  firstButtonText: string;
  purchaseButtonText: string;
}

export const DEFAULT_CONFIG: SiteConfig = {
  locale: "es-CL",
  currency: "EUR",
  price: "€2,99",
  checkoutUrl: "https://eaglemedia.mycartpanda.com/checkout/210148860:1",
  firstButtonText: "EMPEZAR",
  purchaseButtonText: "RECIBIR MI FIGURITA",
};

let cached: SiteConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

export async function getConfig(): Promise<SiteConfig> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached;

  try {
    const sql = getDb();
    const rows = await sql`SELECT data FROM site_config WHERE id = 1`;
    if (rows.length > 0 && rows[0].data && Object.keys(rows[0].data).length > 0) {
      cached = { ...DEFAULT_CONFIG, ...(rows[0].data as Partial<SiteConfig>) };
    } else {
      cached = { ...DEFAULT_CONFIG };
    }
  } catch {
    cached = { ...DEFAULT_CONFIG };
  }

  cacheTime = Date.now();
  return cached!;
}

export async function saveConfig(data: Partial<SiteConfig>): Promise<void> {
  const sql = getDb();
  const merged = { ...DEFAULT_CONFIG, ...data };
  await sql`
    INSERT INTO site_config (id, data, updated_at)
    VALUES (1, ${JSON.stringify(merged)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  cached = merged;
  cacheTime = Date.now();
}
