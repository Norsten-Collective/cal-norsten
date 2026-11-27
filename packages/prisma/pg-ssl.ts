import type { PoolConfig } from "pg";

// Verified TLS for node-postgres when DATABASE_CA_CERT is set (PEM, or PEM with
// literal "\n"). ssl params are stripped from the URL because pg-connection-string
// would otherwise replace the ssl object below. Unset: behaviour is unchanged.
const SSL_PARAMS = ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"];

export function pgPoolConfig(connectionString: string, extra: PoolConfig = {}): PoolConfig {
  const raw = process.env.DATABASE_CA_CERT?.trim();
  if (!raw) return { connectionString, ...extra };
  const ca = raw.replace(/\\n/g, "\n");
  if (!ca.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error("DATABASE_CA_CERT is set but is not a PEM certificate (value not shown).");
  }
  if (!URL.canParse(connectionString)) {
    throw new Error("DATABASE_CA_CERT is set but DATABASE_URL is not a parseable URL (value not shown).");
  }
  const url = new URL(connectionString);
  for (const p of SSL_PARAMS) url.searchParams.delete(p);
  return { ...extra, connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true } };
}
