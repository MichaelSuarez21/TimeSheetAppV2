'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    // For development testing - creates a test user if none exists
    const createTestUser = async () => {
      if (process.env.NODE_ENV === 'development') {
        try {
          const { data } = await supabase.auth.signUp({
            email: 'test@example.com',
            password: 'password123',
            options: {
              data: {
                full_name: 'Test User',
              }
            }
          });
          
          if (data.user) {
            console.log("Test user available:", data.user.email);
          }
        } catch (error) {
          // Ignore errors, user probably already exists
        }
      }
    };
    
    createTestUser();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMessage(null);
    setDebugInfo(null);
    
    try {
      console.log("Attempting to sign in with:", values.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('No user or session returned');
      }

      const debugSession = {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        token: data.session.access_token.substring(0, 10) + '...',
      };
      
      console.log("Sign in successful:", debugSession);
      setDebugInfo(debugSession);
      
      // Set auth cookie manually to ensure it's available for middleware
      document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Update UI
      toast.success('Signed in successfully!');
      
      // Handle redirection with delay to ensure cookie is set
      console.log("Will redirect to:", redirectPath);
      
      // For immediate user feedback
      setIsLoading(false);
      
      setTimeout(() => {
        window.location.href = redirectPath; // Use direct location change instead of router
      }, 1000);
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      setErrorMessage(error.message || 'Failed to sign in');
      toast.error(error.message || 'Failed to sign in');
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {errorMessage}
          </div>
        )}
        
        {debugInfo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
            <p className="font-medium">Login successful!</p>
            <p>Session established for: {debugInfo.user?.email}</p>
            <p className="mt-2 text-xs opacity-80">Redirecting in a moment...</p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-center text-gray-400">
                Development mode: try test@example.com / password123
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => router.push('/signup')}>
          Don't have an account? Sign up
        </Button>
      </CardFooter>
    </Card>
  );
} 