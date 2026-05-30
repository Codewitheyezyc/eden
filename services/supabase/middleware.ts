import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
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
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });

          // Capture existing cookies to avoid losing them when recreating the response
          const oldCookies = response.cookies.getAll();

          response = NextResponse.next({
            request,
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
        remove(name: string, options: any) {
          request.cookies.delete({
            name,
            ...options,
          });

          // Capture existing cookies to avoid losing them when recreating the response
          const oldCookies = response.cookies.getAll();

          response = NextResponse.next({
            request,
          });

          // Re-apply old cookies
          oldCookies.forEach((cookie) => {
            response.cookies.set(cookie);
          });

          response.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Only call getUser() for protected or auth routes to avoid massive network overhead on public/marketing routes
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isProtectedRoute || isAuthRoute) {
    try {
      if (url && anonKey) {
        const { data: { user } } = await supabase.auth.getUser();

        // Dynamic route protection and redirects
        if (user && isAuthRoute) {
          // If logged in, redirect away from login/register to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        if (!user && isProtectedRoute) {
          // If not logged in, redirect protected routes to login
          const redirectUrl = new URL("/login", request.url);
          redirectUrl.searchParams.set("next", pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      console.error("Failed to refresh user session in middleware:", error);
    }
  }

  return response;
}
