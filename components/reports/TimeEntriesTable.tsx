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
import { 
  Clock, 
  User, 
  ExternalLink, 
  FileText, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [allFilteredEntries, setAllFilteredEntries] = useState<EnhancedTimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [projects, setProjects] = useState<{ [key: string]: Project }>({});
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});
  const [users, setUsers] = useState<{ [key: string]: UserType }>({});
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);

  // Calculate total pages
  const totalPages = Math.ceil(totalEntries / pageSize);

  // Function to enhance time entries with related data
  const enhanceTimeEntries = (
    entries: TimeEntry[],
    projectsMap: { [key: string]: Project },
    tasksMap: { [key: string]: Task },
    usersMap: { [key: string]: UserType }
  ): EnhancedTimeEntry[] => {
    return entries.map(entry => {
      const projectName = entry.project_id ? projectsMap[entry.project_id]?.name : undefined;
      const taskDescription = entry.task_id ? tasksMap[entry.task_id]?.task_description : undefined;
      const user = usersMap[entry.user_id];
      const userName = user ? (user.full_name || user.email) : 'Unknown User';
      
      return {
        ...entry,
        project_name: projectName,
        task_description: taskDescription,
        user_name: userName
      };
    });
  };

  // Fetch time entries based on filters
  useEffect(() => {
    // Reset pagination when filters change
    setPage(1);
    
    const fetchTimeEntries = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Start building the query
        let query = supabase
          .from('time_entries')
          .select('*', { count: 'exact' })
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
        
        // Execute the query to get the count first
        const { count } = await query;
        setTotalEntries(count || 0);
        
        // Get unique user IDs from results by fetching all user IDs that match the filter
        // This might be a separate query for efficiency
        const userIdsQuery = supabase
          .from('time_entries')
          .select('user_id');
        
        // Apply the same filters as the main query
        if (filters.startDate && filters.endDate) {
          const startDateStr = filters.startDate.toISOString().split('T')[0];
          const endDateStr = filters.endDate.toISOString().split('T')[0];
          userIdsQuery.gte('date', startDateStr).lte('date', endDateStr);
        }
        if (filters.users.length > 0) {
          userIdsQuery.in('user_id', filters.users);
        }
        if (filters.entryType === 'project') {
          userIdsQuery.not('project_id', 'is', null);
        } else if (filters.entryType === 'task') {
          userIdsQuery.not('task_id', 'is', null);
        }
        if (filters.projectIds.length > 0) {
          userIdsQuery.in('project_id', filters.projectIds);
        }
        if (filters.taskIds.length > 0) {
          userIdsQuery.in('task_id', filters.taskIds);
        }
        
        const { data: userIdsData } = await userIdsQuery;
        const userIds = [...new Set((userIdsData || []).map(entry => entry.user_id))];
        
        // Fetch all users
        let usersMap: { [key: string]: UserType } = {};
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);
            
          if (usersError) throw usersError;
          
          usersMap = (usersData || []).reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as { [key: string]: UserType });
          
          setUsers(usersMap);
        }
        
        // Similar approach for projects and tasks
        // (Fetch all project and task IDs that match the filter and then load them)
        const projectIdsQuery = supabase
          .from('time_entries')
          .select('project_id')
          .not('project_id', 'is', null);
        
        // Apply the same filters
        if (filters.startDate && filters.endDate) {
          const startDateStr = filters.startDate.toISOString().split('T')[0];
          const endDateStr = filters.endDate.toISOString().split('T')[0];
          projectIdsQuery.gte('date', startDateStr).lte('date', endDateStr);
        }
        if (filters.users.length > 0) {
          projectIdsQuery.in('user_id', filters.users);
        }
        if (filters.entryType === 'project') {
          // Already filtered for non-null project_id
        } else if (filters.entryType === 'task') {
          // If task only, skip this query
          projectIdsQuery.eq('project_id', 'none'); // This ensures no results
        }
        if (filters.projectIds.length > 0) {
          projectIdsQuery.in('project_id', filters.projectIds);
        }
        
        const { data: projectIdsData } = await projectIdsQuery;
        const projectIds = [...new Set((projectIdsData || [])
          .map(entry => entry.project_id)
          .filter(id => id !== null) as string[])];
          
        // Fetch projects
        let projectsMap: { [key: string]: Project } = {};
        if (projectIds.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds);
            
          if (projectsError) throw projectsError;
          
          projectsMap = (projectsData || []).reduce((acc, project) => {
            acc[project.id] = project;
            return acc;
          }, {} as { [key: string]: Project });
          
          setProjects(projectsMap);
        }
        
        // And for tasks
        const taskIdsQuery = supabase
          .from('time_entries')
          .select('task_id')
          .not('task_id', 'is', null);
          
        // Apply the same filters
        if (filters.startDate && filters.endDate) {
          const startDateStr = filters.startDate.toISOString().split('T')[0];
          const endDateStr = filters.endDate.toISOString().split('T')[0];
          taskIdsQuery.gte('date', startDateStr).lte('date', endDateStr);
        }
        if (filters.users.length > 0) {
          taskIdsQuery.in('user_id', filters.users);
        }
        if (filters.entryType === 'project') {
          // If project only, skip this query
          taskIdsQuery.eq('task_id', 'none'); // This ensures no results
        } else if (filters.entryType === 'task') {
          // Already filtered for non-null task_id
        }
        if (filters.taskIds.length > 0) {
          taskIdsQuery.in('task_id', filters.taskIds);
        }
        
        const { data: taskIdsData } = await taskIdsQuery;
        const taskIds = [...new Set((taskIdsData || [])
          .map(entry => entry.task_id)
          .filter(id => id !== null) as string[])];
          
        // Fetch tasks
        let tasksMap: { [key: string]: Task } = {};
        if (taskIds.length > 0) {
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .in('id', taskIds);
            
          if (tasksError) throw tasksError;
          
          tasksMap = (tasksData || []).reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
          }, {} as { [key: string]: Task });
          
          setTasks(tasksMap);
        }
        
        // Now fetch all entries for reports/exports (without pagination)
        const { data: allData } = await query;
        
        if (allData) {
          // Calculate total hours for all filtered entries
          const total = allData.reduce((sum, entry) => sum + entry.hours, 0);
          setTotalHours(total);
          
          // Enhance all entries with related data
          const enhancedAllEntries = enhanceTimeEntries(allData, projectsMap, tasksMap, usersMap);
          
          // Apply search filter if provided
          let filteredAllEntries = enhancedAllEntries;
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredAllEntries = enhancedAllEntries.filter(entry => 
              (entry.project_name?.toLowerCase().includes(searchLower) || false) ||
              (entry.task_description?.toLowerCase().includes(searchLower) || false) ||
              (entry.user_name?.toLowerCase().includes(searchLower) || false) ||
              (entry.notes?.toLowerCase().includes(searchLower) || false)
            );
          }
          
          // Store all filtered entries for report generation
          setAllFilteredEntries(filteredAllEntries);
          setTotalEntries(filteredAllEntries.length);
        }
        
        // Now fetch the paginated entries for display
        // We'll use a range query to implement pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Use the same query but add range
        const { data: paginatedData, error: entriesError } = await query
          .range(from, to);
        
        if (entriesError) throw entriesError;
        
        if (paginatedData) {
          // Enhance paginated entries with related data
          const enhancedPaginatedEntries = enhanceTimeEntries(paginatedData, projectsMap, tasksMap, usersMap);
          
          // Apply search filter if provided
          let filteredPaginatedEntries = enhancedPaginatedEntries;
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredPaginatedEntries = enhancedPaginatedEntries.filter(entry => 
              (entry.project_name?.toLowerCase().includes(searchLower) || false) ||
              (entry.task_description?.toLowerCase().includes(searchLower) || false) ||
              (entry.user_name?.toLowerCase().includes(searchLower) || false) ||
              (entry.notes?.toLowerCase().includes(searchLower) || false)
            );
          }
          
          // Store paginated entries for display
          setTimeEntries(filteredPaginatedEntries);
        }
      } catch (err: any) {
        console.error('Error fetching time entries:', err);
        setError(err.message || 'Failed to load time entries');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeEntries();
  }, [filters, page, pageSize]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setPage(1); // Reset to first page when changing page size
  };

  // Generate CSV export data from all filtered entries
  const handleCsvExport = () => {
    // Prepare data for CSV
    const csvData = allFilteredEntries.map(entry => ({
      Date: format(new Date(entry.date), 'yyyy-MM-dd'),
      User: entry.user_name,
      Type: entry.project_id ? 'Project' : 'Task',
      'Project/Task': entry.project_name || entry.task_description || 'Unknown',
      Hours: entry.hours,
      Notes: entry.notes || ''
    }));
    
    // Convert to CSV
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `time-entries-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle report generation
  const handleGenerateReport = () => {
    // This would typically create a more formatted report
    // For now, we'll just download a CSV
    handleCsvExport();
  };

  // Render loading state
  if (isLoading && page === 1) { // Only show loading on first page load
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-lg">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p className="font-medium">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (totalEntries === 0) {
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <CardTitle className="text-lg">Time Entries</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            No time entries found for the selected filters. Try adjusting your filter criteria.
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
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          <CardTitle className="text-lg">Time Entries</CardTitle>
        </div>
        <Badge variant="outline">
          {totalEntries} entries • {totalHours.toFixed(1)} hours
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border border-t-0 rounded-t-none">
          <div className="max-h-[calc(100vh-20rem)] overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="w-40">User</TableHead>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead>Project / Task</TableHead>
                  <TableHead className="w-24 text-center">Hours</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
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
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">Project</Badge>
                      ) : entry.task_id ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">Task</Badge>
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
                    <TableCell className="text-center">{entry.hours.toFixed(1)}</TableCell>
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
                {isLoading && page > 1 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <span className="text-muted-foreground">Loading more entries...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="py-3 px-4 justify-between border-t">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            Total Hours: <span className="font-medium">{totalHours.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleGenerateReport}>
              <FileText className="mr-1 h-4 w-4" />
              Report
            </Button>
            <Button variant="outline" size="sm" onClick={handleCsvExport}>
              <Download className="mr-1 h-4 w-4" />
              CSV
            </Button>
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate which page numbers to show
                  let pageNum;
                  if (totalPages <= 5) {
                    // Show all pages if there are 5 or fewer
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    // Near the start
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    // Near the end
                    pageNum = totalPages - 4 + i;
                  } else {
                    // In the middle
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <Button
                        variant={page === pageNum ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 