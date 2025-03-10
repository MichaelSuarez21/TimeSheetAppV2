-- Create Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Everyone can view tasks
CREATE POLICY "Anyone can view tasks" ON tasks
  FOR SELECT USING (true);

-- Only admins can insert, update, delete tasks
CREATE POLICY "Admins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update tasks" ON tasks
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tasks" ON tasks
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM users WHERE role = 'admin'
    )
  );

-- Modify time_entries table to add task_id
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  ALTER COLUMN project_id DROP NOT NULL;

-- Create trigger to update the updated_at column for the tasks table
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 