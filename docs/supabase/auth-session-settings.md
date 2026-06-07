# Supabase Auth session settings

Brief uses Supabase Auth with **email OTP** login and cookie-based sessions via `@supabase/ssr`. Session TTL is configured in the Supabase Dashboard, not in application code.

## Recommended settings

Apply these in your Supabase project (**Auth → Settings** and related sections):

| Setting | Value | Purpose |
|---------|-------|---------|
| **JWT expiry** | `3600` seconds (1 hour) | Short-lived access token sent to the backend on each API request |
| **Time-box user sessions** | **Enabled**, `172800` seconds (48 hours) | Force full re-login (new OTP) after 2 days |
| **Inactivity timeout** | **Disabled** | No idle logout; calendar time-box only |

## How it works in this app

1. User signs in on `/login` with a 6-digit email OTP (`verifyOtp`).
2. Supabase sets session cookies; Next.js middleware ([frontend/src/lib/supabase/middleware.ts](../../frontend/src/lib/supabase/middleware.ts)) refreshes the session.
3. The frontend sends the **access token** (1 h JWT) to the backend on each API call ([frontend/src/lib/api-client.ts](../../frontend/src/lib/api-client.ts)).
4. The backend validates the JWT via `supabaseAdmin.auth.getUser(token)`.
5. After **2 days**, the session time-box expires → refresh fails → user is redirected to `/login`.

## OTP settings (login codes)

Separate from session lifetime:

| Setting | Value | Location |
|---------|-------|----------|
| **Email OTP expiration** | `600` seconds (10 min) | Auth → Providers → Email |
| **Email template** | Branded OTP template | Auth → Email Templates → Magic Link |

Use the HTML in [email-otp-template.html](./email-otp-template.html). The template must include `{{ .Token }}` and must **not** include `{{ .ConfirmationURL }}` for OTP-only login.

## URL configuration

| Setting | Value |
|---------|-------|
| **Site URL** | `https://brief.hanif.one` (production) |
| **Redirect URLs** | Keep OAuth/integration callback URLs as needed; login no longer uses magic-link redirects |

## Optional: custom SMTP

For better deliverability and a custom sender (e.g. `noreply@brief.hanif.one`), configure **Auth → SMTP Settings** in the Supabase Dashboard.

## Security notes

- Keep JWT expiry at 1 hour — access tokens are sent on every API request.
- The 2-day time-box limits exposure if a device session is compromised.
- OTP codes are short-lived (10 min) and rate-limited by Supabase.
- Users can sign out from Settings to end the session on the current device.

## Staging / testing

To verify time-box behavior without waiting 2 days, temporarily set **Time-box user sessions** to a shorter value (e.g. `3600` seconds) in a staging Supabase project, then restore `172800` for production.
