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
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { TimeEntry, Project } from '@/types/database';

const formSchema = z.object({
  project_id: z.string({
    required_error: 'Please select a project',
  }),
  hours: z.coerce.number().min(0.1, {
    message: 'Hours must be at least 0.1',
  }).max(24, {
    message: 'Hours cannot exceed 24 per day',
  }),
  date: z.date({
    required_error: 'Please select a date',
  }),
  notes: z.string().optional(),
});

type TimeEntryFormProps = {
  timeEntry?: TimeEntry;
  isEditing?: boolean;
};

export function TimeEntryForm({ timeEntry, isEditing = false }: TimeEntryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFromUrl = searchParams.get('project');
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [creators, setCreators] = useState<{[key: string]: {email?: string, full_name?: string}}>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: projectFromUrl || timeEntry?.project_id || '',
      hours: timeEntry?.hours || 0,
      date: timeEntry?.date ? new Date(timeEntry.date) : new Date(),
      notes: timeEntry?.notes || '',
    },
  });

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
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      if (isEditing && timeEntry) {
        // Update existing time entry
        const { error } = await supabase
          .from('time_entries')
          .update({
            project_id: values.project_id,
            hours: values.hours,
            date: format(values.date, 'yyyy-MM-dd'),
            notes: values.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', timeEntry.id);

        if (error) throw error;
        toast.success('Time entry updated successfully!');
      } else {
        // Create new time entry
        const { error } = await supabase.from('time_entries').insert({
          project_id: values.project_id,
          user_id: user.id,
          hours: values.hours,
          date: format(values.date, 'yyyy-MM-dd'),
          notes: values.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        toast.success('Time entry created successfully!');
      }

      router.push('/dashboard/timesheet');
      router.refresh();
    } catch (error: any) {
      console.error("Error saving time entry:", error);
      toast.error(error.message || 'Failed to save time entry');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="no-projects" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span>{project.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Created by: {getCreatorDisplay(project.user_id)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No projects found in the system. Please{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => router.push('/dashboard/projects/new')}
                  >
                    create a project
                  </Button>{' '}
                  to continue.
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="24"
                  placeholder="Enter hours worked"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
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
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes"
                  className="min-h-32"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/timesheet')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
              ? 'Update Time Entry'
              : 'Create Time Entry'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 