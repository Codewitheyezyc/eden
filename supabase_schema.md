# Eden Supabase Database Schema

Please copy and paste the following SQL into your **Supabase Dashboard > SQL Editor** and click "Run". This will generate the necessary tables, relationships, and Row Level Security (RLS) policies for your multi-tenant architecture.

```sql
-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'COORDINATOR', 'STUDENT');

-- 2. Create Faculties Table
CREATE TABLE public.faculties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Users Table (Mirrors auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create User_Faculties Junction Table (Handles multi-tenancy & roles)
CREATE TABLE public.user_faculties (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE,
    role user_role DEFAULT 'STUDENT'::user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, faculty_id)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_faculties ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Faculties
-- Anyone can read faculties (needed for routing/display)
CREATE POLICY "Faculties are viewable by everyone" ON public.faculties
    FOR SELECT USING (true);

-- 7. RLS Policies for Users
-- Users can read their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 8. RLS Policies for User_Faculties
-- Users can see their own faculty assignments
CREATE POLICY "Users can view their own faculty associations" ON public.user_faculties
    FOR SELECT USING (auth.uid() = user_id);

-- Create a helper function to check admin status (Bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin_of_faculty(f_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_faculties 
    WHERE user_id = auth.uid() 
    AND faculty_id = f_id 
    AND role = 'ADMIN'
  );
$$;

-- Only Admins can view all users within their faculty
CREATE POLICY "Admins can view faculty members" ON public.user_faculties
    FOR SELECT USING (public.is_admin_of_faculty(faculty_id));

-- Only Admins can modify roles within their faculty
CREATE POLICY "Admins can manage faculty roles" ON public.user_faculties
    FOR ALL USING (public.is_admin_of_faculty(faculty_id));

-- 9. Setup Auth Trigger for New Users
-- This automatically creates a record in public.users when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, avatar_url)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- PHASE 2: STUDENT PROFILES & EVENTS SCHEMA
-- ==========================================

-- 10. Student Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    gender VARCHAR(10),
    kingschat_handle VARCHAR(100),
    campus_zone VARCHAR(150),
    date_of_birth DATE,
    bio VARCHAR(500),
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 11. Events Table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    image_url TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone in the faculty" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (public.is_admin_of_faculty(faculty_id));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin_of_faculty(faculty_id));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin_of_faculty(faculty_id));

-- 12. Event Attendance Table
CREATE TABLE public.event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    proof_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, user_id)
);

-- RLS for Event Attendance
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attendance" ON public.event_attendance FOR SELECT USING (auth.uid() = user_id);
-- Admins can view all attendance for an event in their faculty
CREATE POLICY "Admins can view all attendance" ON public.event_attendance FOR SELECT USING (
    public.is_admin_of_faculty((SELECT faculty_id FROM public.events WHERE id = event_id))
);
CREATE POLICY "Users can mark themselves present" ON public.event_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attendance" ON public.event_attendance FOR UPDATE USING (auth.uid() = user_id);

-- 13. Storage Buckets (Creates the buckets for images)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event_proofs', 'event_proofs', true) ON CONFLICT DO NOTHING;

-- Storage RLS (Requires Supabase UI manual verification sometimes, but SQL is provided)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Event proofs are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'event_proofs');
CREATE POLICY "Users can upload their own event proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event_proofs' AND auth.uid() = owner);

-- 10. Seed Initial Faculties (Optional)
INSERT INTO public.faculties (name, slug) VALUES 
    ('Dance Faculty', 'dance'),
    ('Fashion Faculty', 'fashion');
```

## Next Steps
Once you have run this script in Supabase:
1. We will generate the TypeScript types for your database to keep everything strongly typed.
2. We can begin building the Authentication UI (Login / Sign Up forms).
