-- COMPLETE DATABASE RESTORE SCRIPT
-- This script does a thorough cleanup and restoration of database permissions and objects

-- 1. Reset all schema permissions to default
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, service_role;
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;

-- 2. Drop all custom functions to ensure clean slate
DROP FUNCTION IF EXISTS public.check_auth CASCADE;
DROP FUNCTION IF EXISTS public.sync_users_from_auth CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE; 
DROP FUNCTION IF EXISTS public.check_admin_for_users_access CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin_result CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists_by_email CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists_by_id CASCADE;

-- 3. Drop all triggers we might have created
DROP TRIGGER IF EXISTS check_admin_insert_users ON public.users;
DROP TRIGGER IF EXISTS check_admin_delete_users ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_users_trigger ON auth.users;

-- 4. Complete reset of RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL policies on users table for clean restart
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
    END LOOP;
END $$;

-- 6. Reset auth table RLS if it was modified
DO $$
BEGIN
    -- Only try to modify auth.users RLS if the table exists and we have permission
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        BEGIN
            -- Try to reset auth RLS
            ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
            EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if we don't have permission
        END;
    END IF;
END $$;

-- 7. Create minimal default policies for users table
CREATE POLICY "Enable read access for all authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update access for users to their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 8. Create basic is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 9. Fix permissions on important tables
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT UPDATE ON public.users TO authenticated;

-- 10. Add basic security policies to projects, time_entries and reports if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        -- Drop existing policies to start clean
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "Allow read access for all users" ON public.projects';
            EXCEPTION WHEN OTHERS THEN NULL;
        END;
        
        -- Create basic policies
        EXECUTE 'CREATE POLICY "Allow read access for all users" ON public.projects FOR SELECT TO authenticated USING (true)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_entries') THEN
        -- Drop existing policies to start clean  
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "Allow read access for all users" ON public.time_entries';
            EXCEPTION WHEN OTHERS THEN NULL;
        END;
        
        -- Create basic policies
        EXECUTE 'CREATE POLICY "Allow read access for all users" ON public.time_entries FOR SELECT TO authenticated USING (true)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        -- Drop existing policies to start clean
        BEGIN  
            EXECUTE 'DROP POLICY IF EXISTS "Allow read access for all users" ON public.reports';
            EXCEPTION WHEN OTHERS THEN NULL;
        END;
        
        -- Create basic policies
        EXECUTE 'CREATE POLICY "Allow read access for all users" ON public.reports FOR SELECT TO authenticated USING (true)';
    END IF;
END $$; 