-- Open Permissions SQL Script for TimeSheet App
-- Run this in Supabase SQL Editor to allow all authenticated users
-- to view, edit and delete all projects and time entries

-- Enable Row Level Security (RLS) on both tables (if not already enabled)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow individual read access" ON projects;
DROP POLICY IF EXISTS "Allow individual insert access" ON projects;
DROP POLICY IF EXISTS "Allow individual update access" ON projects;
DROP POLICY IF EXISTS "Allow individual delete access" ON projects;

DROP POLICY IF EXISTS "Allow individual read access" ON time_entries;
DROP POLICY IF EXISTS "Allow individual insert access" ON time_entries;
DROP POLICY IF EXISTS "Allow individual update access" ON time_entries;
DROP POLICY IF EXISTS "Allow individual delete access" ON time_entries;

-- Create new open policies for projects
CREATE POLICY "Allow authenticated read access" ON projects
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert access" ON projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON projects
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete access" ON projects
    FOR DELETE
    TO authenticated
    USING (true);

-- Create new open policies for time_entries
CREATE POLICY "Allow authenticated read access" ON time_entries
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert access" ON time_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON time_entries
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete access" ON time_entries
    FOR DELETE
    TO authenticated
    USING (true);

-- Create users table if it doesn't exist (for storing user profile information)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see all users
CREATE POLICY "Allow authenticated to read all users" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create a trigger to automatically insert a new user record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the trigger already exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$; 