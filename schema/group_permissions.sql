-- Group-Based Permissions SQL Script for TimeSheet App
-- This is for FUTURE implementation of group-based permissions
-- Do NOT run this script yet

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table to track which users belong to which groups
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create group_projects table to associate projects with groups
CREATE TABLE group_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, project_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_projects ENABLE ROW LEVEL SECURITY;

-- Create functions to check if a user is a member or admin of a group
CREATE OR REPLACE FUNCTION is_group_member(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM group_members
        WHERE group_id = $1 AND user_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_group_admin(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM group_members
        WHERE group_id = $1 AND user_id = $2 AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for groups table
CREATE POLICY "Users can view groups they belong to" ON groups
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM group_members
            WHERE group_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "All users can create groups" ON groups
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Group admins can update group details" ON groups
    FOR UPDATE
    TO authenticated
    USING (
        is_group_admin(id, auth.uid())
    );

CREATE POLICY "Group admins can delete groups" ON groups
    FOR DELETE
    TO authenticated
    USING (
        is_group_admin(id, auth.uid()) OR created_by = auth.uid()
    );

-- Policies for group_members table
CREATE POLICY "Users can view members of their groups" ON group_members
    FOR SELECT
    TO authenticated
    USING (
        is_group_member(group_id, auth.uid())
    );

CREATE POLICY "Group admins can add members" ON group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_group_admin(group_id, auth.uid())
    );

CREATE POLICY "Group admins can update membership details" ON group_members
    FOR UPDATE
    TO authenticated
    USING (
        is_group_admin(group_id, auth.uid())
    );

CREATE POLICY "Group admins can remove members" ON group_members
    FOR DELETE
    TO authenticated
    USING (
        is_group_admin(group_id, auth.uid())
    );

-- Policies for group_projects
CREATE POLICY "Users can view projects in their groups" ON group_projects
    FOR SELECT
    TO authenticated
    USING (
        is_group_member(group_id, auth.uid())
    );

CREATE POLICY "Group admins can add projects to groups" ON group_projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_group_admin(group_id, auth.uid())
    );

CREATE POLICY "Group admins can remove projects from groups" ON group_projects
    FOR DELETE
    TO authenticated
    USING (
        is_group_admin(group_id, auth.uid())
    );

-- Modified policies for projects
-- Here we'd replace the original project policies with group-aware ones
/*
DROP POLICY IF EXISTS "Allow authenticated read access" ON projects;
DROP POLICY IF EXISTS "Allow authenticated update access" ON projects;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON projects;

CREATE POLICY "Users can view projects they have access to" ON projects
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1
            FROM group_projects gp
            JOIN group_members gm ON gp.group_id = gm.group_id
            WHERE gp.project_id = projects.id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own projects or as a group admin" ON projects
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1
            FROM group_projects gp
            JOIN group_members gm ON gp.group_id = gm.group_id
            WHERE gp.project_id = projects.id AND gm.user_id = auth.uid() AND gm.is_admin = true
        )
    );

CREATE POLICY "Users can delete their own projects or as a group admin" ON projects
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1
            FROM group_projects gp
            JOIN group_members gm ON gp.group_id = gm.group_id
            WHERE gp.project_id = projects.id AND gm.user_id = auth.uid() AND gm.is_admin = true
        )
    );
*/

-- Similar policies would be created for time_entries
-- This is commented out as it would be implemented later
/*
DROP POLICY IF EXISTS "Allow authenticated read access" ON time_entries;
DROP POLICY IF EXISTS "Allow authenticated update access" ON time_entries;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON time_entries;

CREATE POLICY "Users can view time entries they have access to" ON time_entries
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1
            FROM group_projects gp
            JOIN group_members gm ON gp.group_id = gm.group_id
            WHERE gp.project_id = time_entries.project_id AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own time entries or as a group admin" ON time_entries
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1
            FROM group_projects gp
            JOIN group_members gm ON gp.group_id = gm.group_id
            WHERE gp.project_id = time_entries.project_id AND gm.user_id = auth.uid() AND gm.is_admin = true
        )
    );

CREATE POLICY "Users can delete their own time entries or as a group admin" ON time_entries
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1
            FROM group_projects gp
            JOIN group_members gm ON gp.group_id = gm.group_id
            WHERE gp.project_id = time_entries.project_id AND gm.user_id = auth.uid() AND gm.is_admin = true
        )
    );
*/ 