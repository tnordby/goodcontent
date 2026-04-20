# GoodContent

Next.js (App Router) + Convex + Clerk.

## Local development

Install dependencies:

```bash
pnpm install
```

Copy env vars (do not commit secrets):

```bash
cp .env.example .env.local
```

Run Next + Convex dev together:

```bash
pnpm dev
```

## Deploying to Vercel

Set the environment variables from `.env.example` in the Vercel project settings (Production + Preview).

Minimum set that commonly blocks builds:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL` (Convex **Cloud** URL ending in `.convex.cloud`)

Recommended:

- `CLERK_JWT_ISSUER_DOMAIN` (must match the Clerk JWT template issuer used by Convex)
- `CLERK_WEBHOOK_SECRET` (for `convex/http.ts` Clerk webhooks)
- `NEXT_PUBLIC_SITE_URL` (canonical URL for Open Graph metadata)

## Convex production checklist

1. Create a **production** Convex deployment in the Convex dashboard.
2. Deploy functions to prod:

```bash
npx convex deploy
```

3. Set Convex environment variables in the Convex dashboard (not just Vercel), including `CLERK_JWT_ISSUER_DOMAIN` and `CLERK_WEBHOOK_SECRET` as required by your deployment.
4. Set `NEXT_PUBLIC_CONVEX_URL` in Vercel to the **prod** Convex cloud URL.

## Working in this repo (important)

The canonical git checkout used for commits/pushes is:

`/Users/thorsteinnordby/Desktop/Projects/goodcontent-repo`

If you also keep a separate editor folder at `/Users/thorsteinnordby/Desktop/Projects/goodcontent`, treat it as a **synced working copy** (it does not contain `.git` in this setup).
