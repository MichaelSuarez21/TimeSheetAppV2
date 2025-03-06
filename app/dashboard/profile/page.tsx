'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    email: '',
    fullName: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authUser) {
          router.push('/signin');
          throw new Error('Not authenticated');
        }
        
        setUser(authUser);
        
        // Get the user's profile from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (userError && userError.code !== 'PGRST116') { // PGRST116 is 'not found'
          console.error('Error fetching user profile:', userError);
          toast.error('Failed to load user profile');
        }
        
        // Set the profile data
        setProfile({
          email: authUser.email || '',
          fullName: userData?.full_name || '',
        });
        
      } catch (error: any) {
        console.error('Profile load error:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Update the user's profile in the users table
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: profile.email,
          full_name: profile.fullName,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse space-y-8 w-full max-w-md">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile details here
          </CardDescription>
        </CardHeader>
        <form onSubmit={saveProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                value={profile.email} 
                onChange={handleChange} 
                disabled 
              />
              <p className="text-xs text-gray-500">Email cannot be changed here</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                name="fullName" 
                value={profile.fullName} 
                onChange={handleChange} 
                placeholder="Enter your full name" 
              />
              <p className="text-xs text-gray-500">
                This name will be displayed to other users
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 