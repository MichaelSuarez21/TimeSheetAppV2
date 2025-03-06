'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TimeEntry } from '@/types/database';

function TimeEntryForm({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    hours: '',
    date: '',
    notes: '',
  });

  // Fetch the time entry
  useEffect(() => {
    async function fetchTimeEntry() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('id', entryId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Time entry not found');

        setEntry(data);
        setFormData({
          hours: data.hours.toString(),
          date: data.date,
          notes: data.notes || '',
        });
      } catch (err: any) {
        console.error('Error fetching time entry:', err);
        setError(err.message);
        toast.error('Failed to load time entry');
      } finally {
        setLoading(false);
      }
    }

    fetchTimeEntry();
  }, [entryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const hours = parseFloat(formData.hours);
      if (isNaN(hours) || hours <= 0) {
        throw new Error('Please enter a valid number of hours');
      }

      const { error } = await supabase
        .from('time_entries')
        .update({
          hours,
          date: formData.date,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;
      
      toast.success('Time entry updated successfully');
      
      // Navigate back to the project page if we have a project_id
      if (entry?.project_id) {
        router.push(`/dashboard/projects/${entry.project_id}`);
      } else {
        router.push('/dashboard/timesheet');
      }
    } catch (err: any) {
      console.error('Error updating time entry:', err);
      toast.error(err.message || 'Failed to update time entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Loading Time Entry...</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Time Entry Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error || 'Time entry could not be loaded'}
        </div>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Time Entry</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Entry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.hours}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Optional notes about this time entry"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TimeEntryEditPage() {
  const params = useParams();
  const entryId = params.entryId as string;
  
  return <TimeEntryForm entryId={entryId} />;
} 