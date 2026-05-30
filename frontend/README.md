# Connector frontend

Next.js 15 App Router UI for Connector. Talks only to the backend at `NEXT_PUBLIC_API_URL` — provider OAuth tokens never reach the browser.

## Stack

- Next.js (App Router)
- React 18
- Tailwind CSS
- `@supabase/supabase-js` (Auth)

## Layout

```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                landing
│   ├── (auth)/login/page.tsx
│   ├── dashboard/page.tsx      daily feed
│   └── integrations/page.tsx
├── components/
│   ├── ui/
│   ├── feed/
│   └── integrations/
├── lib/
│   ├── api-client.ts           fetch wrapper for the backend
│   ├── supabase.ts             browser Supabase client
│   └── utils.ts
├── hooks/
└── types/
```

## Scripts

```bash
bun install
cp .env.example .env.local
bun run dev
```
