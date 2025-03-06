'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, RefreshCcw, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { TimeEntry, Project } from '@/types/database';

export default function TimeSheetPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<{[key: string]: Project}>({});
  const [users, setUsers] = useState<{[key: string]: {email?: string, full_name?: string}}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all time entries - with open permissions
      const { data: entriesData, error: entriesError } = await supabase
        .from('time_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (entriesError) throw entriesError;
      
      setTimeEntries(entriesData || []);
      console.log(`Fetched ${entriesData?.length || 0} time entries`);
      
      // Get all relevant projects
      if (entriesData && entriesData.length > 0) {
        const projectIds = [...new Set(entriesData.map(entry => entry.project_id))];
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
          
        if (projectsError) throw projectsError;
        
        const projectsMap = (projectsData || []).reduce((acc, project) => {
          acc[project.id] = project;
          return acc;
        }, {} as {[key: string]: Project});
        
        setProjects(projectsMap);
      }
      
      // Get all relevant users
      if (entriesData && entriesData.length > 0) {
        const userIds = [...new Set(entriesData.map(entry => entry.user_id))];
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', userIds);
          
        if (!usersError && usersData) {
          const usersMap = usersData.reduce((acc, user) => {
            acc[user.id] = { email: user.email, full_name: user.full_name };
            return acc;
          }, {} as {[key: string]: {email?: string, full_name?: string}});
          
          setUsers(usersMap);
        }
      }
    } catch (err: any) {
      console.error('Error fetching time entries:', err);
      setError(err.message);
      toast.error('Failed to load timesheet');
    } finally {
      setLoading(false);
    }
  }

  // Get display name for a user
  const getUserDisplay = (userId: string) => {
    const user = users[userId];
    if (user?.full_name) return user.full_name;
    if (user?.email) return user.email.split('@')[0];
    return userId.substring(0, 8) + '...';
  };

  // Get project name
  const getProjectName = (projectId: string) => {
    return projects[projectId]?.name || 'Unknown Project';
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          <Button variant="outline" onClick={fetchData}>
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
                <th className="px-4 py-3 text-left font-medium">Hours</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="px-4 py-3">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/dashboard/projects/${entry.project_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {getProjectName(entry.project_id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{entry.hours}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1 text-gray-400" />
                      {getUserDisplay(entry.user_id)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                    {entry.notes || 'No notes'}
                  </td>
                  <td className="px-4 py-3 text-right">
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