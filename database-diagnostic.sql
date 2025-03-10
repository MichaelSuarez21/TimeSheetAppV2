-- DATABASE DIAGNOSTIC SCRIPT
-- This script checks various database settings to diagnose authentication issues

-- 1. Check schema permissions
SELECT nspname AS schema_name, 
       rolname AS role_name, 
       priv.privilege_type 
FROM pg_namespace
CROSS JOIN pg_roles
LEFT JOIN (
    SELECT nspname, grantee, privilege_type 
    FROM information_schema.usage_privileges 
    WHERE object_type = 'SCHEMA'
) AS priv 
ON priv.nspname = pg_namespace.nspname 
AND priv.grantee = pg_roles.rolname
WHERE nspname IN ('public', 'auth') 
AND rolname IN ('anon', 'authenticated', 'service_role');

-- 2. Check users table
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
) AS users_table_exists;

-- 3. Check RLS on users table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 4. List all policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Check is_admin function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'is_admin';

-- 6. Check auth users and public users match
SELECT 
    auth_users.count AS auth_users_count,
    public_users.count AS public_users_count
FROM 
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users;

-- 7. Check a specific user
SELECT 
    a.email AS auth_email, 
    u.email AS public_email,
    u.role AS role
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
WHERE a.email = 'michaelanderssuarez@gmail.com';

-- 8. Check important authentication functions
SELECT proname, pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname IN ('uid', 'role', 'jwt', 'current_session')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'); 