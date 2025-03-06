'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  BarChart, 
  FolderPlus, 
  User, 
  LogOut, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserData {
  id: string;
  email: string;
  fullName: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || '',
        });
      }
    };
    
    getUser();
  }, []);
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/signin');
    }
  };
  
  // Get the initials for the avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white flex items-center justify-between p-4 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-xl font-bold">
            TimeSheet App
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:bg-transparent flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm mr-1 hidden md:flex">
                    <span className="font-medium">{user.fullName || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => router.push('/signin')}>
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 border-r bg-gray-50 p-4 hidden md:block">
          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                pathname === '/dashboard' ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              <Clock className="mr-2 h-5 w-5" />
              <span>Timesheets</span>
            </Link>
            <Link 
              href="/dashboard/projects" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                pathname.startsWith('/dashboard/projects') ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              <FolderPlus className="mr-2 h-5 w-5" />
              <span>Projects</span>
            </Link>
            <Link 
              href="/dashboard/reports" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${
                pathname.startsWith('/dashboard/reports') ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              <BarChart className="mr-2 h-5 w-5" />
              <span>Reports</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 