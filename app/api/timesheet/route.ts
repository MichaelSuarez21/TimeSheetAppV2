import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Check for API key in header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }
    
    // In a real app, you would validate the API key against a database
    // For now, we'll use a simple check against the service role key
    if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Get user ID from query params
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get optional filters
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        projects:project_id (
          name,
          description
        )
      `)
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    // Execute query
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timesheet data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Check for API key in header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }
    
    // In a real app, you would validate the API key against a database
    if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { userId, projectId, hours, date, notes } = body;
    
    // Validate required fields
    if (!userId || !projectId || !hours || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, projectId, hours, date' },
        { status: 400 }
      );
    }
    
    // Insert time entry
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: userId,
      project_id: projectId,
      hours,
      date,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create time entry' },
      { status: 500 }
    );
  }
} 