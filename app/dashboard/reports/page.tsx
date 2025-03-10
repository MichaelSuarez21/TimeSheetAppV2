'use client';

import { useState, useEffect } from 'react';
import { ReportFilters, type ReportFilters as ReportFiltersType, type DateRangeType, type EntryTypeFilter } from '@/components/reports/ReportFilters';
import { TimeEntriesTable } from '@/components/reports/TimeEntriesTable';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Filter, Clock, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ReportsPage() {
  // Initialize filters with default values
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: 'currentWeek',
    startDate: startOfWeek(new Date(), { weekStartsOn: 0 }), // Sunday
    endDate: endOfWeek(new Date(), { weekStartsOn: 0 }), // Saturday
    users: [],
    entryType: 'all',
    projectIds: [],
    taskIds: [],
    searchTerm: '',
  });
  
  const [activeTab, setActiveTab] = useState('time-entries');
  const [user, setUser] = useState<any>(null);
  
  // Check user auth on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    
    checkAuth();
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports &amp; Analytics</h1>
      </div>
      
      <Tabs defaultValue="time-entries" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="time-entries">
            <Clock className="mr-2 h-4 w-4" />
            Time Entries
          </TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        <TabsContent value="time-entries" className="space-y-6 pt-4">
          <ReportFilters filters={filters} onFiltersChange={handleFiltersChange} />
          <TimeEntriesTable filters={filters} />
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Visual insights into your time data (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 border rounded-md">
                <p className="text-muted-foreground">
                  Analytics features are coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and download reports (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 border rounded-md">
                <p className="text-muted-foreground">
                  Report generation features are coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 