import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, User, ExternalLink, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { ReportFilters, EntryTypeFilter } from './ReportFilters';
import type { TimeEntry, Project, Task, User as UserType } from '@/types/database';

// Extended TimeEntry type with project and task details
interface EnhancedTimeEntry extends TimeEntry {
  project_name?: string;
  task_description?: string;
  user_name?: string;
}

interface TimeEntriesTableProps {
  filters: ReportFilters;
  className?: string;
}

export function TimeEntriesTable({ filters, className }: TimeEntriesTableProps) {
  const [timeEntries, setTimeEntries] = useState<EnhancedTimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});
  const [users, setUsers] = useState<{ [key: string]: UserType }>({});

  // Fetch time entries based on filters
  useEffect(() => {
    const fetchTimeEntries = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Start building the query
        let query = supabase
          .from('time_entries')
          .select('*')
          .order('date', { ascending: false });
        
        // Apply date range filter
        if (filters.startDate && filters.endDate) {
          const startDateStr = filters.startDate.toISOString().split('T')[0];
          const endDateStr = filters.endDate.toISOString().split('T')[0];
          query = query.gte('date', startDateStr).lte('date', endDateStr);
        }
        
        // Apply user filter
        if (filters.users.length > 0) {
          query = query.in('user_id', filters.users);
        }
        
        // Apply entry type filter (project or task)
        if (filters.entryType === 'project') {
          query = query.not('project_id', 'is', null);
        } else if (filters.entryType === 'task') {
          query = query.not('task_id', 'is', null);
        }
        
        // Apply project filter if specific projects are selected
        if (filters.projectIds.length > 0) {
          query = query.in('project_id', filters.projectIds);
        }
        
        // Apply task filter if specific tasks are selected
        if (filters.taskIds.length > 0) {
          query = query.in('task_id', filters.taskIds);
        }
        
        // Execute the query
        const { data, error: entriesError } = await query;
        
        if (entriesError) throw entriesError;
        
        // Calculate total hours
        const total = (data || []).reduce((sum, entry) => sum + entry.hours, 0);
        setTotalHours(total);
        
        // Get unique project IDs, task IDs, and user IDs from results
        const projectIds = [...new Set((data || [])
          .filter(entry => entry.project_id)
          .map(entry => entry.project_id))];
          
        const taskIds = [...new Set((data || [])
          .filter(entry => entry.task_id)
          .map(entry => entry.task_id))];
          
        const userIds = [...new Set((data || []).map(entry => entry.user_id))];
        
        // Fetch projects
        if (projectIds.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds);
            
          if (projectsError) throw projectsError;
          
          const projectsMap = (projectsData || []).reduce((acc, project) => {
            acc[project.id] = project;
            return acc;
          }, {} as { [key: string]: Project });
          
          setProjects(projectsMap);
        }
        
        // Fetch tasks
        if (taskIds.length > 0) {
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .in('id', taskIds);
            
          if (tasksError) throw tasksError;
          
          const tasksMap = (tasksData || []).reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
          }, {} as { [key: string]: Task });
          
          setTasks(tasksMap);
        }
        
        // Fetch users
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);
            
          if (usersError) throw usersError;
          
          const usersMap = (usersData || []).reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as { [key: string]: UserType });
          
          setUsers(usersMap);
        }
        
        // Enhance time entries with project, task, and user names
        const enhancedEntries = (data || []).map(entry => {
          const projectName = entry.project_id ? projects[entry.project_id]?.name : undefined;
          const taskDescription = entry.task_id ? tasks[entry.task_id]?.task_description : undefined;
          const user = users[entry.user_id];
          const userName = user ? (user.full_name || user.email) : 'Unknown User';
          
          return {
            ...entry,
            project_name: projectName,
            task_description: taskDescription,
            user_name: userName
          };
        });
        
        // Apply search filter if provided
        let filteredEntries = enhancedEntries;
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredEntries = enhancedEntries.filter(entry => 
            (entry.project_name?.toLowerCase().includes(searchLower) || false) ||
            (entry.task_description?.toLowerCase().includes(searchLower) || false) ||
            (entry.user_name?.toLowerCase().includes(searchLower) || false) ||
            (entry.notes?.toLowerCase().includes(searchLower) || false)
          );
        }
        
        setTimeEntries(filteredEntries);
      } catch (err: any) {
        console.error('Error fetching time entries:', err);
        setError(err.message || 'Failed to load time entries');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeEntries();
  }, [filters]);

  // Render loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Error Loading Data</CardTitle>
          <CardDescription>
            There was a problem loading the time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p className="font-medium">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (timeEntries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Time Entries
          </CardTitle>
          <CardDescription>
            No time entries found for the selected filters
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters to see more results
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reset Filters
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Time Entries
          </div>
          <Badge variant="outline" className="ml-2">
            {timeEntries.length} entries • {totalHours.toFixed(1)} hours
          </Badge>
        </CardTitle>
        <CardDescription>
          Showing time entries based on your selected filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Project / Task</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="mr-1 h-3 w-3 text-muted-foreground" />
                      <span>{entry.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.project_id ? (
                      <Badge>Project</Badge>
                    ) : entry.task_id ? (
                      <Badge variant="secondary">Task</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.project_id && entry.project_name ? (
                      <Link 
                        href={`/dashboard/projects/${entry.project_id}`}
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        {entry.project_name}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    ) : entry.task_id && entry.task_description ? (
                      <span className="text-green-600">{entry.task_description}</span>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>{entry.hours.toFixed(1)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.notes || <span className="text-muted-foreground">No notes</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <Link href={`/dashboard/timesheet/${entry.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-sm text-muted-foreground">
          Total Hours: <span className="font-medium">{totalHours.toFixed(1)}</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 