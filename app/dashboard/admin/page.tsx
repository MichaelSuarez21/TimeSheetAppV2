'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, Shield, BarChart, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [totalTimeEntries, setTotalTimeEntries] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        setLoading(true);
        
        // Check if current user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/dashboard');
          return;
        }
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (userError || !userData) {
          toast.error('Failed to verify admin status');
          router.push('/dashboard');
          return;
        }
        
        if (userData.role !== 'admin') {
          toast.error('You do not have admin privileges');
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
        
        // Fetch counts
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
          
        const { count: timeEntriesCount } = await supabase
          .from('time_entries')
          .select('*', { count: 'exact', head: true });
        
        setTotalUsers(usersCount || 0);
        setTotalProjects(projectsCount || 0);
        setTotalTimeEntries(timeEntriesCount || 0);
        
      } catch (error) {
        console.error('Error in admin dashboard:', error);
        toast.error('Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAndFetchData();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage users, projects, and system settings</p>
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
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Admin Tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-500" />
                User Management
              </CardTitle>
              <CardDescription>
                Add, edit, or remove user accounts
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/admin/users">
                  Manage Users
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-red-500" />
                Permissions
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/admin/users">
                  Manage Roles
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 