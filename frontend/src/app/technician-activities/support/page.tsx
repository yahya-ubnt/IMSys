'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTechnicianActivities, deleteTechnicianActivity } from '@/lib/technicianActivityService';
import { TechnicianActivity } from '@/types/technician-activity';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { columns } from '../columns';
import { PlusCircle } from 'lucide-react';


export default function SupportActivitiesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedTechnician = ''; // For filtering
  const [activities, setActivities] = useState<TechnicianActivity[]>([]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { activityType: "Support"; technicianId?: string } = { activityType: 'Support' };
      if (selectedTechnician) filters.technicianId = selectedTechnician;
      // Add date range logic here if needed

      const data = await getTechnicianActivities(filters);
      setActivities(data);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to fetch support activities.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to fetch support activities. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteTechnicianActivity(id);
        toast({
          title: 'Activity Deleted',
          description: 'Activity has been successfully deleted.',
        });
        fetchActivities(); // Refresh the list
      } catch (err: unknown) {
        toast({ title: 'Error', description: (err instanceof Error) ? err.message : 'Failed to delete activity.', variant: 'destructive' });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-zinc-400">Loading support activities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error: {error}</p>
            <Button onClick={fetchActivities} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-400">Support Activities</h1>
            <p className="text-zinc-400">View and manage technician support activities.</p>
          </div>
          <Button onClick={() => router.push('/technician-activities/support/new')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Support Activity
          </Button>
        </div>

        <Card className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg">
          <CardHeader>
            <CardTitle className="text-blue-400">Support Activities Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters can go here */}
            <DataTable
              columns={columns(handleDelete)}
              data={activities}
              onRowClick={(activity: TechnicianActivity) => {
                router.push(`/technician-activities/${activity._id}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
