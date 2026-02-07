import { Context } from "hono";
import { AppEnv, ClerkAuth } from "./types";

type CacheEntry = {
  expiresAt: number;
};

const isAuthenticated = (c: Context<AppEnv>) =>
  Boolean((c.get("auth") as ClerkAuth | null)?.userId);

const now = () => Math.floor(Date.now() / 1000);

export async function withCache(
  c: Context<AppEnv>,
  key: string,
  compute: () => Promise<Response>
): Promise<Response> {
  const backend = c.env.CACHE_BACKEND ?? "r2";
  if (backend !== "r2" || c.req.method !== "GET" || isAuthenticated(c)) {
    return compute();
  }

  const bucket = c.env.CACHE_BUCKET;
  const ttl = Number(c.env.CACHE_TTL_SECONDS ?? 5);
  const versionedKey = `${c.env.CACHE_VERSION ?? "v1"}:${key}`;

  const cached = await bucket.get(versionedKey);
  if (cached) {
    const entry: CacheEntry = {
      expiresAt: Number(cached.customMetadata?.expiresAt ?? "0"),
    };
    if (entry.expiresAt > now()) {
      const headers = new Headers();
      cached.writeHttpMetadata(headers);
      return new Response(await cached.arrayBuffer(), {
        headers,
      });
    }
  }

  return refresh(bucket, versionedKey, compute, ttl);
}

async function refresh(
  bucket: R2Bucket,
  key: string,
  compute: () => Promise<Response>,
  ttl: number
): Promise<Response> {
  const resp = await compute();
  if (!resp.ok) return resp;

  const buf = await resp.clone().arrayBuffer();
  const headers = Object.fromEntries(resp.headers.entries());
  const current = now();
  const entry: CacheEntry = {
    expiresAt: current + ttl,
  };
  await bucket.put(key, buf, {
    httpMetadata: {
      contentType: headers["content-type"],
      cacheControl: headers["cache-control"],
      contentLanguage: headers["content-language"],
      contentDisposition: headers["content-disposition"],
      contentEncoding: headers["content-encoding"],
    },
    customMetadata: {
      expiresAt: String(entry.expiresAt),
    },
  });
  return resp;
}
