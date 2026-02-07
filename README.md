```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## Environment
Required bindings (see `wrangler.jsonc`):
- D1: `DB`
- R2: `CACHE_BUCKET`
- Clerk: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Clerk sign-in: `CLERK_SIGN_IN_URL`
- Cache vars: `CACHE_BACKEND`, `CACHE_TTL_SECONDS`, `CACHE_VERSION`
## Templates & styling
HTML templates live in `public/templates/*.html`. Styling uses Tailwind via CDN in `layout.html`.

## Database
Schema lives in `src/db/schema.ts`. Drizzle generates SQL into `drizzle/`, then we copy SQL to `migrations/` for Wrangler.
```txt
npm run db:generate
npm run d1:migrate:local
```
For remote migrations use:
```txt
npm run d1:migrate:remote
```

## Media import
Hit `/admin/import` (requires admin role in Clerk metadata) to load `data/*.json`.

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
