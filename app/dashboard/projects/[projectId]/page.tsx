'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit2, 
  FileText, 
  PlusCircle, 
  RefreshCcw,
  User,
  Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Project, TimeEntry } from '@/types/database';

interface ProjectDetails extends Project {
  time_entries?: TimeEntry[];
}

interface ProjectStats {
  totalHours: number;
  totalEntries: number;
  uniqueContributors: number;
  firstEntry: string | null;
  lastEntry: string | null;
}

// Create a client component that receives the id via a prop
function ProjectDetailsClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalHours: 0,
    totalEntries: 0,
    uniqueContributors: 0,
    firstEntry: null,
    lastEntry: null
  });
  const [userDisplayNames, setUserDisplayNames] = useState<{[key: string]: string}>({});

  async function fetchProjectData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error('Project not found');

      // Fetch time entries related to this project
      const { data: entriesData, error: entriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (entriesError) throw entriesError;

      // Get all unique user IDs from time entries and the project creator
      const uniqueUserIds = [
        ...new Set([
          projectData.user_id,
          ...(entriesData?.map(entry => entry.user_id) || [])
        ])
      ];
      
      // Fetch user details from the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', uniqueUserIds);
        
      // Create a map of user IDs to display names
      const displayNames: {[key: string]: string} = {};
      
      if (!usersError && usersData) {
        usersData.forEach(user => {
          // Use full name if available, otherwise use email username
          displayNames[user.id] = user.full_name || user.email.split('@')[0];
        });
      }
      
      // Get current user info
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Add special handling for current user
      if (currentUser && uniqueUserIds.includes(currentUser.id)) {
        const baseDisplayName = displayNames[currentUser.id] || currentUser.email?.split('@')[0] || '';
        displayNames[currentUser.id] = `${baseDisplayName} (You)`;
      }
      
      // Set display names
      setUserDisplayNames(displayNames);

      // Calculate project statistics
      const stats: ProjectStats = {
        totalHours: entriesData?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0,
        totalEntries: entriesData?.length || 0,
        uniqueContributors: uniqueUserIds.length - 1, // Don't count project creator as contributor
        firstEntry: null,
        lastEntry: null
      };

      if (entriesData && entriesData.length > 0) {
        // Sort entries by date
        const sortedEntries = [...entriesData].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        stats.firstEntry = sortedEntries[0].date;
        stats.lastEntry = sortedEntries[sortedEntries.length - 1].date;
      }

      // Update state with all the data
      setProject(projectData);
      setTimeEntries(entriesData || []);
      setProjectStats(stats);
    } catch (err: any) {
      console.error('Error fetching project data:', err);
      setError(err.message);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/dashboard/projects')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Loading Project...</h1>
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

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/dashboard/projects')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Project Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error || 'Project could not be loaded'}
        </div>
        <Button onClick={() => router.push('/dashboard/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/dashboard/projects')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchProjectData}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${projectId}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/timesheet/new?project=${projectId}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Time Entry
            </Link>
          </Button>
        </div>
      </div>

      {project.description && (
        <div className="text-gray-600">
          {project.description}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalEntries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.uniqueContributors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(project.created_at).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time-entries" className="w-full">
        <TabsList>
          <TabsTrigger value="time-entries">Time Entries</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="details">Project Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="time-entries" className="py-4">
          {timeEntries.length === 0 ? (
            <div className="rounded-md border p-8 text-center">
              <h3 className="text-lg font-medium">No time entries yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start tracking time for this project.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href={`/dashboard/timesheet/new?project=${projectId}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Time Entry
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium">Date</th>
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
                        <td className="px-4 py-3">{entry.hours}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {userDisplayNames[entry.user_id] || `User ${entry.user_id.slice(0, 8)}...`}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {entry.notes ? (
                            <span className="line-clamp-1">{entry.notes}</span>
                          ) : (
                            <span className="text-gray-400">No notes</span>
                          )}
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
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="contributors" className="py-4">
          {projectStats.uniqueContributors === 0 ? (
            <div className="rounded-md border p-8 text-center">
              <h3 className="text-lg font-medium">No contributors yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Contributors will appear here when they log time to this project.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...new Set(timeEntries.map(entry => entry.user_id))].map((userId) => {
                const userEntries = timeEntries.filter(entry => entry.user_id === userId);
                const totalHours = userEntries.reduce((sum, entry) => sum + entry.hours, 0);
                
                return (
                  <Card key={userId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-md">
                        <User className="mr-2 h-4 w-4" />
                        {userDisplayNames[userId] || `User ${userId.slice(0, 8)}...`}
                      </CardTitle>
                      <CardDescription>Contributor</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {totalHours.toFixed(1)} hours logged
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {userEntries.length} time {userEntries.length === 1 ? 'entry' : 'entries'}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="py-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Created By</h3>
                  <p className="text-gray-600">
                    {userDisplayNames[project.user_id] || `User ${project.user_id.slice(0, 8)}...`}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Created On</h3>
                  <p className="text-gray-600">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-medium">Last Updated</h3>
                  <p className="text-gray-600">{new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-medium">Project ID</h3>
                  <p className="text-gray-600 text-xs">{project.id}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Time Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Total Hours Logged</h3>
                  <p className="text-gray-600">{projectStats.totalHours.toFixed(1)} hours</p>
                </div>
                <div>
                  <h3 className="font-medium">Total Time Entries</h3>
                  <p className="text-gray-600">{projectStats.totalEntries} entries</p>
                </div>
                {projectStats.firstEntry && (
                  <div>
                    <h3 className="font-medium">First Entry Date</h3>
                    <p className="text-gray-600">{new Date(projectStats.firstEntry).toLocaleDateString()}</p>
                  </div>
                )}
                {projectStats.lastEntry && (
                  <div>
                    <h3 className="font-medium">Most Recent Entry</h3>
                    <p className="text-gray-600">{new Date(projectStats.lastEntry).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Remove the params from the props and use useParams() directly
export default function ProjectDetailsPage() {
  const params = useParams();
  // We need to safely extract the projectId from params
  const projectId = params.projectId as string;
  
  return <ProjectDetailsClient projectId={projectId} />;
} 