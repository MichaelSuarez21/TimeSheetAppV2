import { NextResponse } from 'next/server';
import { handleUserUpdate, handleUserDelete } from './helper';

// Simple GET route
export async function GET(_request: Request, context: any) {
  const { params } = context;
  return NextResponse.json({ id: params.id });
}

// PATCH route using helper
export async function PATCH(request: Request, context: any) {
  const { params } = context;
  const data = await request.json();
  return handleUserUpdate(params.id, data);
}

// DELETE route using helper
export async function DELETE(_request: Request, context: any) {
  const { params } = context;
  return handleUserDelete(params.id);
} 