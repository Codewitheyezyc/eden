import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase browser client initialized with missing environment variables!");
  }

  // createBrowserClient from @supabase/ssr automatically manages the browser-side
  // singleton instance, cookie synchronization, and robust auth locking without deadlocks.
  return createBrowserClient(url || "", anonKey || "");
}


