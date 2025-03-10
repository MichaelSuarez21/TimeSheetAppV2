-- Create roles enum type
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to existing users table
ALTER TABLE users 
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Admin users can update all profiles
CREATE POLICY "Admins can update all profiles" 
  ON users FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Projects policies - Allow admins to see all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Time entries policies - Allow admins to see all time entries
CREATE POLICY "Admins can view all time entries"
  ON time_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Reports policies - Allow admins to see all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Set your admin user (replace with your actual email)
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Optionally add a comment to make it clear this user is an admin
COMMENT ON COLUMN users.role IS 'User role - can be either user or admin'; 