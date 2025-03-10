-- ADMIN USER CREATION SCRIPT
-- This script creates an admin user directly in the database
-- Only run this if other restoration attempts fail

-- Step 1: Create a user in auth.users (if you have permission)
-- Note: This might fail if you don't have full permission to auth schema
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- First try to get the user ID from auth if the user already exists
  SELECT id INTO user_id FROM auth.users WHERE email = 'michaelanderssuarez@gmail.com';
  
  -- If user doesn't exist, create in auth (requires permission)
  IF user_id IS NULL THEN
    -- This requires permission to auth schema, might not work
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'michaelanderssuarez@gmail.com',
        -- A secure default password: 'Password123!'
        '$2a$10$UrxjV6EVdFnG5Q5UnbmQXONSXS0JUQiA2K1UEg0yCGfbz9SKvvpO.',
        NOW(),
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id INTO user_id;
      RAISE NOTICE 'Created auth user with ID %', user_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create auth user: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Found existing auth user with ID %', user_id;
  END IF;
  
  -- Step 2: Create a user in public.users table
  IF user_id IS NOT NULL THEN
    -- Create or update entry in public.users
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      created_at
    ) VALUES (
      user_id,
      'michaelanderssuarez@gmail.com',
      'Michael Suarez',
      'admin',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE 'Created/updated admin user in public.users table';
  ELSE
    -- If we couldn't get the auth user ID, create with a random UUID
    -- This is not ideal but might work in some cases
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'michaelanderssuarez@gmail.com',
      'Michael Suarez',
      'admin',
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE 'Created/updated admin user with new ID in public.users table';
  END IF;
END$$; 