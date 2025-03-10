'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { TimeEntry, Project } from '@/types/database';
import { cn } from '@/lib/utils';

// Add Task type
interface Task {
  id: string;
  task_description: string;
}

const formSchema = z.object({
  // A type field to determine if this is a project or task entry
  entry_type: z.enum(['project', 'task']),
  
  // Make project_id optional since it's only required for project entries
  project_id: z.string().optional(),
  
  // Add task_id which is required for task entries
  task_id: z.string().optional(),
  
  hours: z.coerce.number().min(0.1, {
    message: 'Hours must be at least 0.1',
  }).max(24, {
    message: 'Hours cannot exceed 24 per day',
  }),
  
  date: z.date({
    required_error: 'Please select a date',
  }),
  
  notes: z.string().optional(),
}).refine(data => {
  // Ensure that either project_id or task_id is provided based on entry_type
  if (data.entry_type === 'project') {
    return !!data.project_id;
  } else if (data.entry_type === 'task') {
    return !!data.task_id;
  }
  return false;
}, {
  message: "You must select either a project or a task",
  path: ['entry_type'], 
});

type TimeEntryFormProps = {
  timeEntry?: TimeEntry;
  isEditing?: boolean;
  projectId?: string; // Optional prop for pre-selecting a project
};

export function TimeEntryForm({ timeEntry, isEditing = false, projectId }: TimeEntryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFromUrl = searchParams.get('project');
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creators, setCreators] = useState<{[key: string]: {email?: string, full_name?: string}}>({});
  
  // Determine initial entry type based on time entry or projectId
  const initialEntryType = timeEntry?.task_id ? 'task' : 'project';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_type: initialEntryType,
      project_id: timeEntry?.project_id || projectId || '',
      task_id: timeEntry?.task_id || '',
      hours: timeEntry?.hours || 0,
      date: timeEntry?.date ? new Date(timeEntry.date) : new Date(),
      notes: timeEntry?.notes || '',
    },
  });

  const entryType = form.watch('entry_type');
  
  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch all projects (not just the user's own projects)
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setProjects(data || []);
        
        // Get creator details for all unique user IDs
        if (data && data.length > 0) {
          const uniqueUserIds = [...new Set(data.map(project => project.user_id))];
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', uniqueUserIds);
            
          if (!usersError && usersData) {
            const creatorsMap = usersData.reduce((acc, user) => {
              acc[user.id] = { email: user.email, full_name: user.full_name };
              return acc;
            }, {} as {[key: string]: {email?: string, full_name?: string}});
            setCreators(creatorsMap);
          }
        }
        
        // Fetch all tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, task_description')
          .order('task_description', { ascending: true });
          
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        toast.error(error.message || 'Failed to load projects');
      }
    }

    fetchProjects();
  }, []);

  // Helper function to get creator display name
  const getCreatorDisplay = (userId: string) => {
    const creator = creators[userId];
    if (creator?.full_name) return creator.full_name;
    if (creator?.email) return creator.email.split('@')[0];
    return userId.substring(0, 8) + '...';
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form values:", values); // Add this for debugging
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare the time entry data
      const timeEntryData: any = {
        user_id: user.id,
        hours: values.hours,
        date: values.date.toISOString().split('T')[0],
        notes: values.notes || null,
      };
      
      // Add either project_id or task_id based on entry_type
      if (values.entry_type === 'project' && values.project_id) {
        timeEntryData.project_id = values.project_id;
        timeEntryData.task_id = null; // Clear task_id if present
      } else if (values.entry_type === 'task' && values.task_id) {
        timeEntryData.task_id = values.task_id;
        timeEntryData.project_id = null; // Clear project_id if present
      } else {
        // If neither condition was met, then we don't have valid data
        throw new Error('You must select either a project or a task');
      }

      console.log("Submitting time entry data:", timeEntryData); // Add this for debugging

      if (isEditing && timeEntry) {
        // Update existing time entry
        const { error } = await supabase
          .from('time_entries')
          .update(timeEntryData)
          .eq('id', timeEntry.id);

        if (error) throw error;
        
        toast.success('Time entry updated');
        router.push('/dashboard/timesheet');
      } else {
        // Create new time entry
        const { data, error } = await supabase
          .from('time_entries')
          .insert(timeEntryData)
          .select()
          .single();

        if (error) throw error;
        
        toast.success('Time entry created');
        router.push('/dashboard/timesheet');
      }
    } catch (error: any) {
      console.error('Error submitting time entry:', error);
      toast.error(error.message || 'Failed to save time entry');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Entry Type Selection */}
        <FormField
          control={form.control}
          name="entry_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Entry Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="project" id="project" />
                    <label htmlFor="project" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Project
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="task" id="task" />
                    <label htmlFor="task" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Task
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Project Selection - Only show if entry type is 'project' */}
        {entryType === 'project' && (
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        <span className="text-xs text-gray-500 ml-2">
                          (by {getCreatorDisplay(project.user_id)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Task Selection - Only show if entry type is 'task' */}
        {entryType === 'task' && (
          <FormField
            control={form.control}
            name="task_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.task_description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Hours Input */}
        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Picker */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes Textarea */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes here"
                  className="min-h-24 resize-none"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Time Entry"
          )}
        </Button>
      </form>
    </Form>
  );
} 