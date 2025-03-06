'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCcw, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Project } from '@/types/database';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creators, setCreators] = useState<{[key: string]: {email?: string, full_name?: string}}>({}); 

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all projects - since we've updated permissions to allow seeing all projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} projects`);
      setProjects(data || []);
      
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
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  // Format creator name for display
  const getCreatorDisplay = (userId: string) => {
    const creator = creators[userId];
    if (creator?.full_name) return creator.full_name;
    if (creator?.email) return creator.email.split('@')[0];
    return userId.substring(0, 8) + '...';
  };

  // Check if current user is the creator
  const isCurrentUserCreator = async (projectUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === projectUserId;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
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
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchProjects}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-4">
          <p className="font-semibold">Error loading projects:</p>
          <p>{error}</p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
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
      ) : (
        <div className="rounded-md border">
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Created By</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b">
                    <td className="px-4 py-3 font-medium">
                      <Link 
                        href={`/dashboard/projects/${project.id}`}
                        className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {project.description ? (
                        <span className="line-clamp-1">{project.description}</span>
                      ) : (
                        <span className="text-gray-400">No description</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-gray-400" />
                        {getCreatorDisplay(project.user_id)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/timesheet/new?project=${project.id}`}>
                          Log Time
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          View
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
    </div>
  );
} 