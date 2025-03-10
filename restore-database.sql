-- EMERGENCY RESTORE SCRIPT
-- This script will revert all changes made to the database and restore the original functionality

-- 1. First, restore table permissions
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop all functions and triggers we created
DROP FUNCTION IF EXISTS public.check_auth CASCADE;
DROP FUNCTION IF EXISTS public.sync_users_from_auth CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_for_users_access CASCADE;
DROP TRIGGER IF EXISTS check_admin_insert_users ON public.users;
DROP TRIGGER IF EXISTS check_admin_delete_users ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Drop all policies we created or modified
DROP POLICY IF EXISTS "Allow anyone to read user data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow new user creation" ON public.users;
DROP POLICY IF EXISTS "Allow users to access their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users to view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own auth record" ON auth.users;

-- 4. Restore original policies
-- These were the policies that existed originally

-- Create basic policies for users table
CREATE POLICY "Allow authenticated to read all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. Fix the is_admin function (simplify it)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql; 