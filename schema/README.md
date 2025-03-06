# TimeSheet App - Database Setup Instructions

This directory contains SQL scripts for setting up and configuring the Supabase database for the TimeSheet application.

## Setting Up Open Permissions

The file `open_permissions.sql` contains the SQL script to set up a permission system where any authenticated user can view, edit, and delete all projects and time entries.

### To apply these permissions:

1. Log in to your Supabase dashboard.
2. Go to the SQL Editor by clicking on "SQL Editor" in the left sidebar.
3. Click "New Query" to create a new SQL query.
4. Copy and paste the contents of `open_permissions.sql` into the query editor.
5. Click "Run" to execute the script.

## Migrating Auth Users to the Users Table

The file `migrate_users.sql` contains a script to copy your authenticated users from Supabase's auth.users table to the public.users table, which enables your frontend to display user names instead of UUIDs.

### To migrate users:

1. Log in to your Supabase dashboard.
2. Go to the SQL Editor by clicking on "SQL Editor" in the left sidebar.
3. Click "New Query" to create a new SQL query.
4. Copy and paste the contents of `migrate_users.sql` into the query editor.
5. Click "Run" to execute the script.

This script will:
- Create the users table if it doesn't exist
- Set up Row Level Security (RLS) with appropriate policies
- Create triggers to automatically sync new and updated users
- Migrate all existing auth users to the users table
- Display the migrated users for verification

After running this script, your frontend will be able to display user names instead of UUIDs.

## Basic Schema Structure

The TimeSheet app relies on the following tables:

### `projects` table
- `id` (UUID, primary key)
- `name` (text)
- `description` (text, optional)
- `user_id` (UUID, references auth.users)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### `time_entries` table
- `id` (UUID, primary key)
- `project_id` (UUID, references projects)
- `user_id` (UUID, references auth.users)
- `date` (date)
- `hours` (numeric)
- `notes` (text, optional)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### `users` table
- `id` (UUID, primary key, references auth.users)
- `email` (text)
- `full_name` (text, optional)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

## Future Group-Based Permissions

For future implementation of group-based permissions, you'll need to create additional tables:

- `groups` - to store group information
- `group_members` - to track which users belong to which groups
- `group_projects` - to associate projects with groups

This will be implemented in a future update. 