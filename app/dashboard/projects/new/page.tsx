'use client';

import { ProjectForm } from '@/components/projects/ProjectForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push('/dashboard/projects')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">New Project</h1>
      </div>
      <p className="text-gray-500">Create a new project to track your time</p>
      
      <div className="border rounded-md p-6">
        <ProjectForm />
      </div>
    </div>
  );
} 