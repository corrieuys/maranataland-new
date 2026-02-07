export type MediaType = "video" | "audio";

export type MediaItem = {
  id?: number;
  uid: string;
  type: MediaType;
  number?: number | null;
  category?: string | null;
  title: string;
  description?: string | null;
  keywords?: string | null;
  stream_url: string;
  thumbnail_url?: string | null;
  featured?: boolean;
  published?: boolean;
  created_at?: number;
  updated_at?: number;
};
export type MediaImportItem = {
  uid?: string;
  title: string;
  type?: MediaType;
  number?: number | string | null;
  category?: string | null;
  description?: string | null;
  keywords?: string | null;
  stream_url?: string;
  thumbnail_url?: string | null;
  streamUrl?: string;
  thumbnailUrl?: string | null;
  featured?: boolean | number;
  published?: boolean | number;
};

export type UserRole = "user" | "admin";

export type SiteContent = {
  key: string;
  value: string;
};

export type ClerkAuth = {
  userId: string;
  role: UserRole;
};

export type Bindings = CloudflareBindings;
export type AppEnv = { Bindings: Bindings; Variables: { auth: ClerkAuth | null } };
