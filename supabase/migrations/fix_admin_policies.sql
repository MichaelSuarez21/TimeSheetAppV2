-- Create a security-definer function to check if a user is an admin
-- This bypasses RLS policies, preventing the infinite recursion
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin
  FROM users
  WHERE id = user_id;
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now replace all the existing policies that check for admin role

-- Drop existing policies that might be causing the infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
DROP POLICY IF EXISTS "Admins can insert profiles" ON users;
DROP POLICY IF EXISTS "Admins can delete profiles" ON users;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all time entries" ON time_entries;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

-- Create new policies using the security-definer function
-- Users policies
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" 
  ON users FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" 
  ON users FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles" 
  ON users FOR DELETE 
  USING (is_admin(auth.uid()));

-- Projects policies
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all projects"
  ON projects FOR DELETE
  USING (is_admin(auth.uid()));

-- Time entries policies
CREATE POLICY "Admins can view all time entries"
  ON time_entries FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all time entries"
  ON time_entries FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all time entries"
  ON time_entries FOR DELETE
  USING (is_admin(auth.uid()));

-- Reports policies
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all reports"
  ON reports FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all reports"
  ON reports FOR DELETE
  USING (is_admin(auth.uid())); 