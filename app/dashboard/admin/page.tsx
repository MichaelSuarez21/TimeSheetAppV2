'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [totalTimeEntries, setTotalTimeEntries] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // First, double-check admin status on the client side
        const adminCheckResponse = await fetch('/api/check-admin');
        const adminCheckData = await adminCheckResponse.json();
        
        if (!adminCheckData.isAdmin) {
          toast.error('Admin access required');
          return;
        }

        // Fetch system stats using our regular supabase client
        // These queries should succeed if the user is properly authenticated
        // and has appropriate permissions
        
        // Count users
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) {
          console.error('Error counting users:', usersError);
        } else {
          setTotalUsers(usersCount || 0);
        }
        
        // Count projects
        const { count: projectsCount, error: projectsError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        
        if (projectsError) {
          console.error('Error counting projects:', projectsError);
        } else {
          setTotalProjects(projectsCount || 0);
        }
        
        // Count time entries
        const { count: entriesCount, error: entriesError } = await supabase
          .from('time_entries')
          .select('*', { count: 'exact', head: true });
        
        if (entriesError) {
          console.error('Error counting time entries:', entriesError);
        } else {
          setTotalTimeEntries(entriesCount || 0);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage users, projects, and system data</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Users
            </CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="text-sm text-gray-500">Total registered users</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/admin/users">
                Manage Users
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-green-500" />
              Projects
            </CardTitle>
            <CardDescription>All organization projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalProjects}</p>
            <p className="text-sm text-gray-500">Total active projects</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/projects">
                View Projects
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-purple-500" />
              Activity
            </CardTitle>
            <CardDescription>Time tracking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTimeEntries}</p>
            <p className="text-sm text-gray-500">Total time entries</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/reports">
                View Reports
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 