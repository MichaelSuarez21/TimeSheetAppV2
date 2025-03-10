import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Only run the middleware on specific paths that require auth
  const PROTECTED_PATHS = ['/dashboard', '/api/timesheet'];
  const ADMIN_PATHS = ['/dashboard/admin'];
  const AUTH_PATHS = ['/signin', '/signup'];
  
  const path = req.nextUrl.pathname;
  const isProtectedPath = PROTECTED_PATHS.some(prefix => path.startsWith(prefix));
  const isAdminPath = ADMIN_PATHS.some(prefix => path.startsWith(prefix));
  const isAuthPath = AUTH_PATHS.some(prefix => path === prefix);
  
  // Skip middleware for paths that don't need auth checks
  if (!isProtectedPath && !isAuthPath) {
    return res;
  }
  
  console.log("Auth middleware running on path:", path);
  
  try {
    // Create a Supabase client for the middleware
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return res;
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Try all possible auth cookie names
    const possibleCookieNames = [
      'sb-auth-token',
      'supabase-auth-token', 
      'timesheet-session'
    ];
    
    // Debug cookies
    const allCookies = req.cookies.getAll();
    const allCookieNames = allCookies.map(c => c.name).join(', ');
    console.log("All cookies:", allCookieNames);
    
    let token = null;
    let user = null;
    
    // Check each cookie for a valid token
    for (const cookieName of possibleCookieNames) {
      const cookieValue = req.cookies.get(cookieName)?.value;
      if (cookieValue) {
        try {
          console.log(`Trying auth with cookie: ${cookieName}`);
          const { data } = await supabase.auth.getUser(cookieValue);
          if (data?.user) {
            token = cookieValue;
            user = data.user;
            console.log(`Valid session found for user: ${user.email}`);
            break;
          }
        } catch (err) {
          console.log(`Cookie ${cookieName} exists but validation failed`);
        }
      }
    }

    // Handle protected routes when not authenticated
    if (isProtectedPath && !user) {
      console.log("Redirecting to signin - no valid session found");
      const redirectUrl = new URL('/signin', req.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect signed-in users away from auth pages
    if (isAuthPath && user) {
      console.log(`Redirecting authenticated user to dashboard: ${user.email}`);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // Check admin access for admin paths
    if (isAdminPath && user) {
      console.log('Middleware checking admin access');
      
      try {
        // Create admin check API URL with the same host as the current request
        const apiUrl = new URL('/api/check-admin', req.url);
        
        // Call our admin check API with the same request headers (for cookies)
        const adminCheckResponse = await fetch(apiUrl, {
          headers: req.headers
        });
        
        if (!adminCheckResponse.ok) {
          console.error('Admin check API returned error status:', adminCheckResponse.status);
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        const adminCheckData = await adminCheckResponse.json();
        
        if (!adminCheckData.isAdmin) {
          console.log(`User ${user.email} is not an admin:`, adminCheckData.message);
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        console.log(`Admin access granted for ${user.email}`);
      } catch (error) {
        console.error('Error checking admin access:', error);
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    
  } catch (error) {
    console.error("Middleware auth error:", error);
    // Continue the request despite auth errors
  }

  return res;
}

export const config = {
  matcher: [
    // Apply middleware only to specific paths
    '/dashboard/:path*',
    '/signin',
    '/signup',
    '/api/timesheet/:path*'
  ],
}; 