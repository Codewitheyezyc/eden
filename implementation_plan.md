# Install and Configure Core Architecture

This plan covers the installation and configuration of the required core systems for the Eden App, adhering to the SaaS architecture described in the project context.

## User Review Required

> [!IMPORTANT]  
> After approving this plan, I will attempt to run `npm install` for the required packages. Because my background execution environment sometimes encounters permission blocks on your OS, please be prepared to run the installation commands manually if I notify you that the execution failed. 

## Open Questions

None currently.

## Proposed Changes

### Dependencies
I will install the following packages:
- **Supabase**: `@supabase/supabase-js`, `@supabase/ssr`
- **TanStack Query**: `@tanstack/react-query`, `@tanstack/react-query-devtools`
- **Theming**: `next-themes`

---

### Environment Variables
#### [NEW] .env.local
- Setup the environment variable structure for Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Supabase Clients
I will create the standard App Router clients for Supabase inside the `services/` folder:
#### [NEW] services/supabase/client.ts
- Browser client for client components.
#### [NEW] services/supabase/server.ts
- Server component client (read-only cookies).
#### [NEW] services/supabase/middleware.ts
- Middleware client for session refresh.

---

### Providers (State and Theme)
#### [NEW] providers/query-provider.tsx
- Setup the TanStack `QueryClientProvider` and configure default stale times.
#### [NEW] providers/theme-provider.tsx
- Setup `next-themes` for system, light, and dark mode support with Tailwind class manipulation.

---

### Application Layout
#### [MODIFY] app/layout.tsx
- Wrap the application children in both the `ThemeProvider` and `QueryProvider`.
- Configure the theme provider to default to system preferences and enable `class` mode for Tailwind.

---

### Middleware
#### [NEW] middleware.ts
- Setup the root Next.js middleware to run the Supabase session check, which is required for SSR auth flows.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
- Verify that `npm run dev` compiles successfully without errors.
- Check that the theme can toggle (by testing class injection).
- Verify that TanStack query is accessible in client components.
