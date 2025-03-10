'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, BarChart, Trash2, Plus, PenSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TasksManager from './components/TasksManager';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [totalTimeEntries, setTotalTimeEntries] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  
  // State for user dialog
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // First, double-check admin status on the client side
        const adminCheckResponse = await fetch('/api/check-admin');
        
        if (!adminCheckResponse.ok) {
          console.error('Admin check API error:', adminCheckResponse.status);
          return;
        }
        
        const adminCheckData = await adminCheckResponse.json();
        
        if (!adminCheckData.isAdmin) {
          toast.error('Admin access required');
          return;
        }

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .order('created_at', { ascending: false });
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          setUsers(usersData || []);
          setTotalUsers(usersData?.length || 0);
        }
        
        // Count tasks
        const { count: tasksCount, error: tasksError } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true });
        
        if (tasksError) {
          console.error('Error counting tasks:', tasksError);
        } else {
          setTotalTasks(tasksCount || 0);
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

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete the user from the database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
        return;
      }
      
      // Remove from local state
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUserEmail || !newUserName) {
        toast.error('Please fill in all fields');
        return;
      }
      
      // Add the user to the database
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: newUserEmail,
          full_name: newUserName,
          role: 'user',
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error adding user:', error);
        toast.error('Failed to add user');
        return;
      }
      
      // Add to local state
      setUsers([data[0], ...users]);
      toast.success('User added successfully');
      setNewUserEmail('');
      setNewUserName('');
      setIsNewUserDialogOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

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
          <p className="text-gray-500 mt-1">Manage users, tasks, and system data</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
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
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Tasks
            </CardTitle>
            <CardDescription>Task management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTasks}</p>
            <p className="text-sm text-gray-500">Available tasks</p>
          </CardContent>
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
        </Card>
      </div>
      
      {/* Users table section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Users</h2>
          <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. The user will be able to log in once their account is created in Supabase Auth.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    placeholder="user@example.com" 
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddUser}>Add User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium">Full Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-3">{user.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'admin'} // Prevent deleting admin users
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Tasks section - replaced with TasksManager component */}
      <TasksManager />
    </div>
  );
} 