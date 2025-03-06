-- Migrate Users from Supabase Auth to Users Table
-- Run this in the Supabase SQL Editor to populate your users table

-- First, ensure the users table exists
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but create open permissions for authenticated users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all users
DROP POLICY IF EXISTS "Allow authenticated to read all users" ON public.users;
CREATE POLICY "Allow authenticated to read all users" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
CREATE POLICY "Allow users to update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Function to insert or update a user in the users table
CREATE OR REPLACE FUNCTION sync_user_to_users_table() 
RETURNS TRIGGER AS $$
BEGIN
    -- Extract full_name from raw_user_meta_data if available
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_to_users_table();

-- Create trigger to sync updated users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_to_users_table();

-- Migrate existing auth users to the users table
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT * FROM auth.users
    LOOP
        INSERT INTO public.users (id, email, full_name, created_at, updated_at)
        VALUES (
            user_record.id, 
            user_record.email, 
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name',
                SPLIT_PART(user_record.email, '@', 1)
            ),
            user_record.created_at,
            user_record.updated_at
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            updated_at = EXCLUDED.updated_at;
    END LOOP;
END
$$;

-- For debugging, show all migrated users
SELECT * FROM public.users; 