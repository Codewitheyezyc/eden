import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase browser client initialized with missing environment variables!");
  }

  // On the server side (SSR/Prerendering), always return a new client instance
  // to avoid cross-request state pollution.
  if (typeof window === "undefined") {
    return createBrowserClient(url || "", anonKey || "");
  }

  // On the client side (browser), cache the instance so it acts as a singleton.
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      url || "",
      anonKey || "",
      {
        auth: {
          // Custom no-op lock to bypass navigator.locks hanging bugs in React StrictMode
          lock: async (_name, _acquireTimeout, fn) => {
            return await fn();
          },
        },
      }
    );
  }

  return clientInstance;
}


