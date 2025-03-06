'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  BarChart, 
  Clock, 
  Calendar, 
  Briefcase, 
  ChevronDown,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Project, TimeEntry } from '@/types/database';

type DateRange = 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
type GroupBy = 'day' | 'week' | 'month' | 'project';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  
  const [stats, setStats] = useState({
    totalHours: 0,
    personalHours: 0,
    projectCount: 0,
    activeProjectCount: 0,
    avgHoursPerDay: 0,
    topProject: null as null | { name: string, hours: number },
    daysWorked: 0,
  });

  // Get the date range for filtering
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (dateRange) {
      case 'thisWeek':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        return { startDate, endDate };
      
      case 'lastWeek':
        const lastWeekStart = subMonths(startOfWeek(now, { weekStartsOn: 1 }), 0);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
        return { 
          startDate: lastWeekStart,
          endDate: lastWeekEnd
        };
      
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        return { startDate, endDate };
      
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        return { startDate, endDate };
      
      case 'all':
      default:
        return { startDate: null, endDate: null };
    }
  };

  // Fetch the user and data
  useEffect(() => {
    async function fetchUserAndData() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error('User not authenticated');
        
        setUser(user);
        
        // Fetch data
        await Promise.all([
          fetchAllTimeEntries(),
          fetchAllProjects()
        ]);
        
      } catch (err: any) {
        console.error('Error in reports page:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserAndData();
  }, []);

  // When date range changes, recalculate stats
  useEffect(() => {
    if (timeEntries.length > 0 && projects.length > 0) {
      calculateStats();
    }
  }, [timeEntries, projects, dateRange, groupBy]);

  // Fetch all time entries from all users
  const fetchAllTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setTimeEntries(data || []);
      console.log(`Fetched ${data?.length || 0} time entries from all users`);
    } catch (err) {
      console.error('Error fetching all time entries:', err);
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
      
      setProjects(data || []);
      console.log(`Fetched ${data?.length || 0} projects for reports`);
    } catch (err) {
      console.error('Error fetching all projects:', err);
    }
  };

  // Calculate statistics based on filtered data
  const calculateStats = () => {
    const { startDate, endDate } = getDateRange();
    
    // Filter entries by date range
    const filteredEntries = timeEntries.filter(entry => {
      if (!startDate || !endDate) return true;
      
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    // Calculate total hours across all users
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    // Calculate personal hours (only entries by the current user)
    const personalEntries = filteredEntries.filter(entry => entry.user_id === user.id);
    const personalHours = personalEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    // Calculate active projects (projects with time entries from any user)
    const projectsWithEntries = new Set(filteredEntries.map(entry => entry.project_id));
    const activeProjectCount = projectsWithEntries.size;
    
    // Calculate days worked (by anyone)
    const uniqueDays = new Set(filteredEntries.map(entry => entry.date));
    const daysWorked = uniqueDays.size;
    
    // Calculate average hours per day (if there are days worked)
    const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;
    
    // Find the top project by hours
    const projectHours: { [key: string]: number } = {};
    filteredEntries.forEach(entry => {
      if (!projectHours[entry.project_id]) {
        projectHours[entry.project_id] = 0;
      }
      projectHours[entry.project_id] += entry.hours;
    });
    
    let topProject = null;
    let maxHours = 0;
    
    Object.entries(projectHours).forEach(([projectId, hours]) => {
      if (hours > maxHours) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          maxHours = hours;
          topProject = { name: project.name, hours };
        }
      }
    });
    
    setStats({
      totalHours,
      personalHours,
      projectCount: projects.length,
      activeProjectCount,
      avgHoursPerDay,
      topProject,
      daysWorked
    });
  };

  const handleGenerateReport = () => {
    router.push(`/dashboard/reports/generate?range=${dateRange}&groupBy=${groupBy}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse space-y-8 w-full max-w-4xl">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Error Loading Reports</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
          <p className="font-semibold">Error Details:</p>
          <p>{error}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={handleGenerateReport}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
        <div className="flex-1">
          <div className="text-sm font-medium mb-2">Date Range</div>
          <Select 
            value={dateRange} 
            onValueChange={(value) => setDateRange(value as DateRange)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium mb-2">Group By</div>
          <Select 
            value={groupBy} 
            onValueChange={(value) => setGroupBy(value as GroupBy)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Hours</CardTitle>
            <CardDescription>
              {dateRange === 'all' ? 'All time logged hours' : 'Hours in selected period'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalHours.toFixed(1)}</div>
            <div className="text-sm text-gray-500 mt-1">
              Your hours: {stats.personalHours.toFixed(1)}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/timesheet">
                <Clock className="mr-2 h-4 w-4" />
                View Timesheet
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              {dateRange === 'all' 
                ? `Organization total: ${stats.projectCount} | Active: ${stats.activeProjectCount}` 
                : `Active in period: ${stats.activeProjectCount}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.projectCount}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">
                <Briefcase className="mr-2 h-4 w-4" />
                View Projects
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Daily Average</CardTitle>
            <CardDescription>
              {dateRange === 'all' 
                ? 'Average hours per working day' 
                : `Avg hours (${stats.daysWorked} days worked)`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgHoursPerDay.toFixed(1)}</div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-500">
              {stats.daysWorked} working {stats.daysWorked === 1 ? 'day' : 'days'}
            </div>
          </CardFooter>
        </Card>
      </div>

      {stats.topProject && (
        <Card>
          <CardHeader>
            <CardTitle>Top Project</CardTitle>
            <CardDescription>
              Your most time-intensive project for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-lg">{stats.topProject.name}</div>
              <div className="text-sm text-gray-500">
                {stats.topProject.hours.toFixed(1)} hours 
                ({((stats.topProject.hours / stats.totalHours) * 100).toFixed(0)}% of total)
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/reports/project/${projects.find(p => p.name === stats.topProject?.name)?.id}`}>
                View Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Reports</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/reports/history">
              View All Reports
            </Link>
          </Button>
        </div>
        <div className="rounded-md border p-8 text-center">
          <h3 className="text-lg font-medium">No reports generated yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate a report to export your time tracking data.
          </p>
          <div className="mt-4">
            <Button onClick={handleGenerateReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Export Options</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>PDF Export</CardTitle>
              <CardDescription>
                Export your time entries as a PDF document
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/reports/export/pdf?range=${dateRange}&groupBy=${groupBy}`}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PDF
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSV Export</CardTitle>
              <CardDescription>
                Export your time entries as a CSV file
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/reports/export/csv?range=${dateRange}&groupBy=${groupBy}`}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 