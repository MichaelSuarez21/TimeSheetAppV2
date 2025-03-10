'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Clock, Calendar, ExternalLink, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Project, TimeEntry, Task } from '@/types/database';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});
  const [todayHours, setTodayHours] = useState(0);
  const [weekHours, setWeekHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [creators, setCreators] = useState<{[key: string]: {email?: string, full_name?: string}}>({});

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          setAuthError(error.message);
          throw error;
        }
        if (data?.user) {
          setUser(data.user);
          console.log("Dashboard loaded for user:", data.user.email);
          
          // Once we have the user, fetch projects and time entries
          await Promise.all([
            fetchUserProjects(data.user.id),
            fetchAllProjects(),
            fetchTimeEntries(data.user.id)
          ]);
        } else {
          setAuthError("No user found in session");
        }
      } catch (error: any) {
        console.error("Error getting user:", error);
        setAuthError(error.message || "Authentication error");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // Fetch projects for the current user
  const fetchUserProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
      console.log(`Fetched ${data?.length || 0} user projects`);
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  // Fetch all projects (with open permissions)
  const fetchAllProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllProjects(data || []);
      console.log(`Fetched ${data?.length || 0} total projects`);

      // Get creator details for all unique user IDs
      const uniqueUserIds = [...new Set(data?.map(project => project.user_id) || [])];
      if (uniqueUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', uniqueUserIds);
          
        if (!usersError && usersData) {
          const creatorsMap = usersData.reduce((acc, user) => {
            acc[user.id] = { email: user.email, full_name: user.full_name };
            return acc;
          }, {} as {[key: string]: {email?: string, full_name?: string}});
          setCreators(creatorsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching all projects:', error);
    }
  };

  // Get display name for a project creator
  const getCreatorDisplay = (userId: string) => {
    const creator = creators[userId];
    if (creator?.full_name) return creator.full_name;
    if (creator?.email) return creator.email.split('@')[0];
    return userId.substring(0, 8) + '...';
  };

  // Fetch time entries for the user
  const fetchTimeEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setTimeEntries(data || []);
      
      // Calculate today's hours
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = data?.filter(entry => entry.date === today) || [];
      const todayTotal = todayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      setTodayHours(todayTotal);
      
      // Calculate this week's hours
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const weekEntries = data?.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek;
      }) || [];
      
      const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      setWeekHours(weekTotal);
      
      // Fetch tasks data for task-based time entries
      const taskIds = data?.filter(entry => entry.task_id).map(entry => entry.task_id) || [];
      
      if (taskIds.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('id', taskIds);
          
        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else if (tasksData) {
          // Convert to a map for easy lookup
          const tasksMap = tasksData.reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
          }, {} as { [key: string]: Task });
          
          setTasks(tasksMap);
        }
      }
      
      console.log(`Fetched ${data?.length || 0} time entries`);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Authentication Error</h1>
        <p>You appear to be signed out. Please sign in again.</p>
        {authError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
            <p className="font-semibold">Error Details:</p>
            <p>{authError}</p>
          </div>
        )}
        <Button asChild className="mt-4">
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/dashboard/timesheet/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Time Entry
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Today</CardTitle>
            <CardDescription>Hours logged today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayHours.toFixed(1)}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/timesheet/new">
                <Clock className="mr-2 h-4 w-4" />
                Log Hours
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>This Week</CardTitle>
            <CardDescription>Hours logged this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weekHours.toFixed(1)}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reports">
                <Calendar className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Organization projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allProjects.length}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Project
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Time Entries</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/timesheet">View All</Link>
          </Button>
        </div>

        {timeEntries.length === 0 ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium">No time entries yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start tracking your time by creating a new entry.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/dashboard/timesheet/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Time Entry
                  </Link>
                </Button>
              </div>
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
                  <th className="px-4 py-3 text-left font-medium">Notes</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.slice(0, 5).map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {entry.project_id ? (
                        <Link href={`/dashboard/projects/${entry.project_id}`} className="text-blue-600 hover:underline">
                          {allProjects.find(p => p.id === entry.project_id)?.name || 'Unknown Project'}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.task_id ? (
                        <span className="text-green-600 font-medium">
                          {tasks[entry.task_id]?.task_description || 'Unknown Task'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{entry.hours}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{entry.notes || 'No notes'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Projects</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/projects">View All</Link>
          </Button>
        </div>

        {allProjects.length === 0 ? (
          <div className="rounded-md border">
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a project to start tracking your time.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/dashboard/projects/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Project
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allProjects.slice(0, 3).map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 flex items-center mb-1">
                    <User className="h-3 w-3 mr-1" />
                    {getCreatorDisplay(project.user_id)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Created on {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/timesheet/new?project=${project.id}`}>
                      <Clock className="mr-2 h-4 w-4" />
                      Log Time
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {allProjects.length > 3 && (
              <Card className="flex flex-col justify-center items-center p-6 border-dashed text-center">
                <p className="text-sm text-gray-500 mb-4">
                  {allProjects.length - 3} more {allProjects.length - 3 === 1 ? 'project' : 'projects'}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/projects">View All Projects</Link>
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 