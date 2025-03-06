export type User = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  project_id: string;
  user_id: string;
  hours: number;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  project_ids: string[] | null;
  created_at: string;
}; 