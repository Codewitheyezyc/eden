import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !anonKey) {
    console.warn("Supabase middleware client initialized with missing environment variables!");
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          
          // Capture existing cookies to avoid losing them when recreating the response
          const oldCookies = response.cookies.getAll();
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          // Re-apply old cookies
          oldCookies.forEach((cookie) => {
            response.cookies.set(cookie);
          });
          
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          
          // Capture existing cookies to avoid losing them when recreating the response
          const oldCookies = response.cookies.getAll();
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          // Re-apply old cookies
          oldCookies.forEach((cookie) => {
            response.cookies.set(cookie);
          });
          
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // refreshing the auth token
  try {
    if (url && anonKey) {
      await supabase.auth.getUser();
    }
  } catch (error) {
    console.error("Failed to refresh user session in middleware:", error);
  }

  return response;
}
