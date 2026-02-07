import { Context } from "hono";
import type { AppEnv, ClerkAuth, MediaItem, MediaType } from "./types";

export const authLink = (c: Context<AppEnv>) => {
  const auth = c.get("auth") as ClerkAuth | null;
  if (auth?.userId) {
    return `<span class="text-xs bg-white/10 rounded-full px-3 py-1">Ingeteken</span>`;
  }
  const signInUrl = c.env.CLERK_SIGN_IN_URL ?? "https://clerk.com/sign-in";
  return `<a class="hover:underline" href="${signInUrl}">Teken in</a>`;
};

export const isHtmx = (c: Context<AppEnv>) =>
  c.req.header("HX-Request") === "true";

export const cacheKey = (c: Context<AppEnv>, scope: string) =>
  `${scope}:${c.req.url}`;

export const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const optionalString = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : String(value);

export function parseMediaFormData(
  data: Record<string, string | File>,
  overrides?: { uid?: string }
): MediaItem {
  return {
    uid: overrides?.uid ?? String(data.uid ?? ""),
    type: data.type as MediaType,
    title: String(data.title ?? ""),
    description: optionalString(data.description),
    stream_url: String(data.stream_url ?? ""),
    thumbnail_url: optionalString(data.thumbnail_url),
    featured: data.featured === "on",
    published: data.published !== "off",
    category: optionalString(data.category),
    number: parseOptionalNumber(data.number),
    keywords: optionalString(data.keywords),
  };
}
