export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
};
