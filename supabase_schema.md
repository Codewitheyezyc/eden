# Eden Supabase Database Schema

Please copy and paste the following SQL into your **Supabase Dashboard > SQL Editor** and click "Run". This will generate all the necessary tables, relationships, helper functions, RPC routines, triggers, and Row Level Security (RLS) policies for your multi-tenant architecture.

```sql
-- ========================================================
-- 1. ENUMS & EXTENSIONS
-- ========================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'COORDINATOR', 'STUDENT');
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 2. CORE TABLES
-- ========================================================
-- Faculties (Tenants)
CREATE TABLE public.faculties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Users (Profiles Mirror from auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    kingschat_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Faculties Junction (Roles & Tenant membership)
CREATE TABLE public.user_faculties (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE,
    role user_role DEFAULT 'STUDENT'::user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, faculty_id)
);

-- Additional Profiles Data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    gender VARCHAR(10),
    kingschat_handle VARCHAR(100),
    campus_zone VARCHAR(150),
    date_of_birth DATE,
    bio VARCHAR(500),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    leadership_role TEXT,
    leadership_metadata JSONB,
    completed_tour BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- 3. CONTENT & FEATURE TABLES
-- ========================================================
-- Announcements
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    target_campuses TEXT,
    target_roles TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Messages
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    target_campuses TEXT,
    target_roles TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Courses
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'text' NOT NULL,
    cover_gradient TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Lessons
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' NOT NULL,
    duration TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Lesson Progress
CREATE TABLE public.user_lesson_progress (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, lesson_id)
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Events
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    image_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Event Attendance
CREATE TABLE public.event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    proof_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, user_id)
);

-- Reports
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ========================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- ========================================================
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is an admin of a faculty
CREATE OR REPLACE FUNCTION public.is_admin_of_faculty(f_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_faculties 
    WHERE user_id = auth.uid() AND faculty_id = f_id AND role = 'ADMIN'
  );
$$;

-- Helper function to check if a user is an admin or coordinator of a faculty
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator_of_faculty(f_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_faculties 
    WHERE user_id = auth.uid() AND faculty_id = f_id AND role IN ('ADMIN', 'COORDINATOR')
  );
$$;

-- Helper function to check if a user is a member (student, coordinator, or admin) of a faculty
CREATE OR REPLACE FUNCTION public.is_member_of_faculty(f_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_faculties 
    WHERE user_id = auth.uid() AND faculty_id = f_id
  );
$$;

-- 4.1 Faculties Policies
CREATE POLICY "Faculties are viewable by everyone" ON public.faculties FOR SELECT USING (true);

-- 4.2 Users Policies
CREATE POLICY "Users are viewable by authenticated users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile details" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4.3 User Faculties Policies
CREATE POLICY "Users can view their own faculty associations" ON public.user_faculties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view faculty members" ON public.user_faculties FOR SELECT USING (public.is_admin_of_faculty(faculty_id));
CREATE POLICY "Admins can manage faculty roles" ON public.user_faculties FOR ALL USING (public.is_admin_of_faculty(faculty_id));
CREATE POLICY "Users can insert their own initial association" ON public.user_faculties FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4.4 Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.5 Events & Attendance Policies
CREATE POLICY "Events are viewable by faculty members" ON public.events FOR SELECT USING (public.is_member_of_faculty(faculty_id));
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.is_admin_of_faculty(faculty_id));

CREATE POLICY "Users can view their own attendance" ON public.event_attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attendance" ON public.event_attendance FOR SELECT USING (
    public.is_admin_of_faculty((SELECT faculty_id FROM public.events WHERE id = event_id))
);
CREATE POLICY "Users can mark themselves present" ON public.event_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attendance" ON public.event_attendance FOR UPDATE USING (auth.uid() = user_id);

-- 4.6 Reports Policies
CREATE POLICY "Admins/Coordinators can view reports" ON public.reports FOR SELECT USING (public.is_admin_or_coordinator_of_faculty(faculty_id));
CREATE POLICY "Authors can manage their own reports" ON public.reports FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Admins can delete any report" ON public.reports FOR DELETE USING (public.is_admin_of_faculty(faculty_id));

-- 4.7 Announcements & Messages Policies
CREATE POLICY "Announcements viewable by faculty members" ON public.announcements FOR SELECT USING (public.is_member_of_faculty(faculty_id));
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin_of_faculty(faculty_id));

CREATE POLICY "Messages viewable by faculty members" ON public.messages FOR SELECT USING (public.is_member_of_faculty(faculty_id));
CREATE POLICY "Admins/Coordinators can manage messages" ON public.messages FOR ALL USING (public.is_admin_or_coordinator_of_faculty(faculty_id));

-- 4.8 Courses, Lessons, Progress, Notifications Policies
CREATE POLICY "Courses viewable by faculty members" ON public.courses FOR SELECT USING (public.is_member_of_faculty(faculty_id));
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin_of_faculty(faculty_id));

CREATE POLICY "Lessons viewable by course faculty members" ON public.lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.courses 
        WHERE courses.id = course_id AND public.is_member_of_faculty(courses.faculty_id)
    )
);

CREATE POLICY "Users can manage progress" ON public.user_lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view progress" ON public.user_lesson_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- 5. AUTH USER REGISTRATION SYNC TRIGGER
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, avatar_url, email)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        new.email
    );
    return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- 6. ADMIN SYSTEM MANAGEMENT RPC FUNCTIONS
-- ========================================================
-- Delete User Account from auth.users (Requires Service Role / SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_faculties 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only Administrators can perform account deletions.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN TRUE;
END;
$$;

-- Bulk Delete User Accounts
CREATE OR REPLACE FUNCTION public.delete_user_accounts(target_user_ids UUID[])
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_faculties 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only Administrators can perform account deletions.';
  END IF;

  DELETE FROM auth.users WHERE id = ANY(target_user_ids);
  RETURN TRUE;
END;
$$;

-- Delete Users By Role in Faculty
CREATE OR REPLACE FUNCTION public.delete_all_users_by_role(f_id UUID, role_filter user_role)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_faculties 
    WHERE user_id = auth.uid() AND faculty_id = f_id AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only Administrators can perform account deletions.';
  END IF;

  FOR target_user_id IN 
    SELECT user_id FROM user_faculties 
    WHERE faculty_id = f_id AND role = role_filter AND user_id != auth.uid()
  LOOP
    DELETE FROM auth.users WHERE id = target_user_id;
  END LOOP;

  RETURN TRUE;
END;
$$;

-- ========================================================
-- 7. STORAGE BUCKET CREATION & RLS
-- ========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event_proofs', 'event_proofs', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Event proofs are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'event_proofs');
CREATE POLICY "Users can upload their own event proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event_proofs' AND auth.uid() = owner);

-- ========================================================
-- 8. INITIAL SEEDING
-- ========================================================
INSERT INTO public.faculties (name, slug) VALUES 
    ('Dance Faculty', 'dance'),
    ('Fashion Faculty', 'fashion')
ON CONFLICT DO NOTHING;
```
