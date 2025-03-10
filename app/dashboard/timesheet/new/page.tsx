'use client';

import { Suspense } from 'react';
import { TimeEntryForm } from '@/components/timesheet/TimeEntryForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Create a client component that uses useSearchParams
import { useSearchParams } from 'next/navigation';

function TimeEntryFormWithParams() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  return <TimeEntryForm projectId={projectId || undefined} />;
}

export default function NewTimeEntryPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push('/dashboard/timesheet')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">New Time Entry</h1>
      </div>
      <p className="text-gray-500">Log your work hours for a project or task</p>
      
      <div className="border rounded-md p-6">
        <Suspense fallback={<div>Loading form...</div>}>
          <TimeEntryFormWithParams />
        </Suspense>
      </div>
    </div>
  );
} 