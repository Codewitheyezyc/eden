import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase browser client initialized with missing environment variables!");
  }

  // On the server side (SSR/Prerendering), return a fresh client instance
  if (typeof window === "undefined") {
    return createBrowserClient(url || "", anonKey || "");
  }

  // On the client side (browser), cache the instance so it acts as a true singleton.
  // We use a custom no-op lock to bypass navigator.locks hanging bugs on mobile browsers
  // (Android Chrome, Samsung Internet, WebViews, etc.) when tabs are backgrounded or multiple components mount.
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      url || "",
      anonKey || "",
      {
        auth: {
          lock: async (_name, _acquireTimeout, fn) => {
            return await fn();
          },
        },
      }
    );
  }

  return clientInstance;
}
