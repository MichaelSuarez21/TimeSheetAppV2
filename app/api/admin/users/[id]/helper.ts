import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Verify admin role middleware
export async function verifyAdmin(supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { isAdmin: false, error: 'User not authenticated', status: 401 };
    }
    
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

// Handler for updating a user
export async function handleUserUpdate(userId: string, requestData: any) {
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
    
    const { full_name, role } = requestData;
    
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
    
    try {
      // Update user metadata
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name, role }
      });
    } catch (metadataError) {
      console.warn('Could not update user metadata, but user was updated:', metadataError);
      // We don't throw this error as the main update was successful
    }
    
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

// Handler for deleting a user
export async function handleUserDelete(userId: string) {
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