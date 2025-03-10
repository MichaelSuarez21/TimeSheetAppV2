-- Set a specific user as admin (replace the email with your actual admin email)
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- If your actual admin user isn't in the system yet, you'll need to run this
-- after they sign up. 