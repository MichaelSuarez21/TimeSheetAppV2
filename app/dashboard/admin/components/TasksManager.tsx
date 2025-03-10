import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Task } from '@/types/database';

export default function TasksManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Fetch all tasks
  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (error: any) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  // Add a new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    try {
      setIsAddingTask(true);
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ task_description: newTaskDescription.trim() }])
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setNewTaskDescription('');
      toast.success('Task added successfully');
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setIsAddingTask(false);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 rounded"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
        <div className="h-40 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tasks Management</h2>
        <Badge variant="outline">{tasks.length} tasks</Badge>
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <Input
          placeholder="Enter task description..."
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          className="flex-1"
          disabled={isAddingTask}
        />
        <Button type="submit" disabled={isAddingTask || !newTaskDescription.trim()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </form>

      {tasks.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <h3 className="font-medium">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add tasks for users to log time against.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.task_description}</TableCell>
                  <TableCell>
                    {new Date(task.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 