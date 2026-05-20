# Eden System Architecture Design

This document defines the high-level architecture for the Eden App, a multi-tenant SaaS application designed for the Loveworld Arts Academy.

---

## 1. Authentication Flow

The application relies on Supabase Auth integrated with Next.js App Router for secure, scalable authentication.

### **Flow Overview:**
1. **Registration/Login**: Users interact with the auth UI in the `app/(auth)` routes.
2. **Session Creation**: Supabase issues a JWT. The Next.js server-side Supabase client sets this token securely in an HTTP-only cookie.
3. **Database Mirroring**: A Supabase trigger automatically creates a profile record in a public `users` table whenever a new user signs up in `auth.users`.
4. **Middleware Protection**: The root `middleware.ts` intercepts all requests. 
   - If a user tries to access `/dashboard/*` without a valid session, they are redirected to `/login`.
   - If a logged-in user tries to access `/login`, they are redirected to `/dashboard`.

---

## 2. Role System

The Eden App utilizes a strict Role-Based Access Control (RBAC) system. By default, every new user is assigned the `STUDENT` role.

### **Role Hierarchy:**
- **ADMIN**: Full access to their faculty. Can modify content, manage users, and promote students to Coordinators or Admins.
- **COORDINATOR**: Mid-level access. Can manage student activities and track progress, but cannot alter faculty-wide settings or user roles.
- **STUDENT**: Base access. Can view assigned learning resources and interact with standard dashboard features.

### **Enforcement:**
1. **UI Level**: Next.js Server Components fetch the user's role and conditionally render layout items (e.g., hiding the "Admin Settings" sidebar link from students).
2. **API/Data Level (The Source of Truth)**: Roles are enforced directly in the database using Supabase Row Level Security (RLS). Even if a student forces the UI to show an admin button, the database will reject the underlying request.

---

## 3. Multi-Tenant Faculty System

Eden isolates operations by creative faculty (e.g., Dance, Fashion). 

### **Structure:**
- **Faculties Table**: Contains core details about each academy branch.
- **User Association**: Every user is linked to one or more faculties via a junction table (e.g., `faculty_users`) which also stores their specific role within that faculty (e.g., Admin in Dance, Student in Fashion).

### **Tenant Context:**
- The current faculty context is maintained in the URL (e.g., `/dashboard/dance/...`).
- Client-side data fetching via TanStack Query uses the `faculty_id` as part of the query key (e.g., `['lessons', facultyId]`) to prevent state cross-contamination.

---

## 4. Route Structure

The Next.js App Router is divided into three primary layout groups to cleanly separate concerns.

```text
app/
├── (marketing)/                  # Public UI, minimalist SaaS landing
│   ├── page.tsx                  # Home / Landing
│   ├── about/page.tsx            # About Eden
│   └── faculties/page.tsx        # Faculty overviews
│
├── (auth)/                       # No navigation bar, centered forms
│   ├── login/page.tsx            
│   └── register/page.tsx         
│
└── (dashboard)/                  # Protected, Requires Supabase Session
    ├── page.tsx                  # Dashboard index (Faculty selector or auto-redirect)
    └── [facultySlug]/            # Multi-tenant root
        ├── layout.tsx            # Renders faculty-specific sidebar/header
        ├── page.tsx              # Faculty overview
        ├── learning/             # Shared student & coordinator area
        ├── management/           # Coordinator & Admin area
        └── settings/             # Admin-only area
```

---

## 5. Data Isolation Strategy (Security)

Data isolation is critical to ensure that a student in the Fashion faculty cannot read or modify data from the Dance faculty.

### **Database Schema Constraints:**
- Every resource table (e.g., `modules`, `announcements`, `assignments`) **must** include a `faculty_id` foreign key.

### **Supabase Row Level Security (RLS):**
We will implement RLS policies at the PostgreSQL level. All database queries will be subject to policies similar to these:

1. **Tenant Isolation Policy**: 
   `faculty_id` must match the `faculty_id` assigned to the authenticated user.
   *(This ensures Fashion data is completely invisible to Dance users).*

2. **Role Authorization Policy**:
   - `SELECT`: Allowed for all verified members of the faculty (Students, Coordinators, Admins).
   - `INSERT / UPDATE / DELETE`: Allowed **only** if the user's role is `ADMIN` (or `COORDINATOR` for specific tables).

By relying on RLS, data isolation is guaranteed at the database layer, removing the risk of a bug in the Next.js API exposing sensitive cross-tenant data.
