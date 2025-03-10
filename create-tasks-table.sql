-- Create Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for Tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read tasks
CREATE POLICY "Allow all users to read tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage tasks
CREATE POLICY "Allow admins to manage tasks"
ON public.tasks
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add Task ID to time_entries table to support task-based time entries
ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id);

-- Insert some sample tasks
INSERT INTO public.tasks (task_description) VALUES
('Administrative Work'),
('Internal Meetings'),
('Training & Development'),
('Research'),
('Documentation')
ON CONFLICT DO NOTHING; 