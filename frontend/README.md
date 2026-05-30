# Connector frontend

Next.js 15 App Router UI for Connector. Talks only to the backend at `NEXT_PUBLIC_API_URL` — provider OAuth tokens never reach the browser.

## Stack

- Next.js (App Router)
- React 18
- Tailwind CSS
- `@supabase/ssr` + `@supabase/supabase-js` (cookie-based auth)

## Auth flow

- Sign up / sign in at `/login` (first name + email magic link)
- Magic link redirects to `/auth/callback` then `/dashboard`
- Middleware protects `/dashboard` and `/integrations`
- Signed-in users visiting `/` or `/login` are redirected to `/dashboard`

In Supabase **Authentication → URL configuration**, add:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## Layout

```
src/
├── middleware.ts
├── app/
│   ├── (public)/page.tsx, login/page.tsx
│   ├── (protected)/dashboard, integrations
│   └── auth/callback/route.ts
├── lib/supabase/     client, server, middleware helpers
├── hooks/            useFeed, useUser
└── components/
```

## Scripts

```bash
bun install
cp .env.example .env.local
bun run dev
```
