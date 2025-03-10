import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Get the cookies - need to await this
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Get auth cookie - this contains the user's session
  const supabaseAuthCookie = cookieStore.get('supabase-auth-token')?.value;
  
  if (!supabaseAuthCookie) {
    return NextResponse.json({ isAdmin: false, message: 'No auth cookie found' });
  }
  
  // Create a Supabase client with the service role key to bypass RLS
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // The cookie is likely a JWT token directly, not a JSON string array
    // Use it directly instead of trying to parse it
    const { data: { user }, error: userError } = await adminClient.auth.getUser(supabaseAuthCookie);
    
    if (userError || !user) {
      return NextResponse.json({ 
        isAdmin: false, 
        message: userError?.message || 'User not found'
      });
    }
    
    // Directly query the users table to check if the user is an admin
    const { data: userData, error: dbError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (dbError) {
      console.error('Error fetching user role:', dbError);
      return NextResponse.json({ 
        isAdmin: false, 
        message: 'Error fetching user role'
      });
    }
    
    const isAdmin = userData?.role === 'admin';
    
    return NextResponse.json({ 
      isAdmin,
      userId: user.id,
      email: user.email
    });
  } catch (error: any) {
    console.error('Admin check error:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      message: error.message || 'Error checking admin status'
    });
  }
} 