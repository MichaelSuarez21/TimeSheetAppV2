import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Verify admin role middleware
async function verifyAdmin(supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { isAdmin: false, error: 'User not authenticated', status: 401 };
    }
    
    // Try to disable RLS for this query if possible
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error verifying admin status:', error);
      return { 
        isAdmin: false, 
        error: `Error checking user role: ${error.message}`, 
        status: 500,
        details: error
      };
    }
    
    if (!userData || userData.role !== 'admin') {
      return { 
        isAdmin: false, 
        error: 'User does not have admin privileges', 
        status: 403,
        user: { id: user.id, role: userData?.role || 'unknown' }
      };
    }
    
    return { isAdmin: true, user };
  } catch (error: any) {
    console.error('Unexpected error in verifyAdmin:', error);
    return { 
      isAdmin: false, 
      error: `Unexpected error: ${error.message}`, 
      status: 500,
      details: error
    };
  }
}

// Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin role
    const adminCheck = await verifyAdmin(supabase);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error, details: adminCheck },
        { status: adminCheck.status || 403 }
      );
    }
    
    const userId = params.id;
    const { full_name, role } = await request.json();
    
    // Update user in the users table
    const { error } = await supabase
      .from('users')
      .update({ 
        full_name, 
        role
      })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    // Update user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { full_name, role }
    });
    
    return NextResponse.json({ 
      message: 'User updated successfully' 
    });
    
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin role
    const adminCheck = await verifyAdmin(supabase);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error, details: adminCheck },
        { status: adminCheck.status || 403 }
      );
    }
    
    const userId = params.id;
    
    // Delete user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });
    
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
} 