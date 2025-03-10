'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, RefreshCcw, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { TimeEntry, Project, Task } from '@/types/database';

export default function TimeSheetPage() {
  const [timeEntries, setTimeEntries] = useState<Array<TimeEntry & { project_name?: string, task_description?: string }>>([]);
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});
  const [users, setUsers] = useState<{[key: string]: {email?: string, full_name?: string}}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');

        if (projectsError) throw projectsError;

        // Create a map of project ID to project for easy lookup
        const projectsMap = (projectsData || []).reduce((acc, project) => {
          acc[project.id] = project;
          return acc;
        }, {} as { [key: string]: Project });
        
        setProjects(projectsMap);
        
        // Fetch all tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*');
          
        if (tasksError) throw tasksError;
        
        // Create a map of task ID to task for easy lookup
        const tasksMap = (tasksData || []).reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {} as { [key: string]: Task });
        
        setTasks(tasksMap);

        // Fetch user's time entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (entriesError) throw entriesError;

        // Map project names to time entries
        const entriesWithDetails = (entriesData || []).map(entry => ({
          ...entry,
          project_name: entry.project_id ? projectsMap[entry.project_id]?.name : undefined,
          task_description: entry.task_id ? tasksMap[entry.task_id]?.task_description : undefined
        }));

        setTimeEntries(entriesWithDetails);
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
        toast.error('Failed to load timesheet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get display name for a user
  const getUserName = (userId: string) => {
    const user = users[userId];
    if (!user) return 'Unknown User';
    return user.full_name || user.email || 'Unknown User';
  };

  // Get project name
  const getProjectName = (projectId: string) => {
    return projects[projectId]?.name || 'Unknown Project';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Timesheet</h1>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Timesheet</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setLoading(true);
              // Re-run the useEffect by triggering a state change
              setTimeEntries([]);
              setProjects({});
              setTasks({});
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/timesheet/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-4">
          <p className="font-semibold">Error loading timesheet:</p>
          <p>{error}</p>
        </div>
      )}

      {timeEntries.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <h3 className="text-lg font-medium">No time entries yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Track your work by creating a new time entry.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard/timesheet/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Entry
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Project</th>
                <th className="px-4 py-3 text-left font-medium">Task</th>
                <th className="px-4 py-3 text-left font-medium">Hours</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {entry.project_id ? (
                      <Link
                        href={`/dashboard/projects/${entry.project_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {entry.project_name || 'Unknown project'}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.task_id ? (
                      <span className="font-medium text-green-600">
                        {entry.task_description || 'Unknown task'}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{entry.hours}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1 text-gray-400" />
                      {getUserName(entry.user_id)}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {entry.notes || <span className="text-gray-400">No notes</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/timesheet/${entry.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 