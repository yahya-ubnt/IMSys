'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTechnicianActivityById, deleteTechnicianActivity } from '@/lib/technicianActivityService';
import { TechnicianActivity } from '@/types/technician-activity';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CalendarIcon, Tag, FileText, Package, Wrench } from 'lucide-react';

export default function TechnicianActivityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [activity, setActivity] = useState<TechnicianActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) {
        setError('Activity ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getTechnicianActivityById(id as string);
        setActivity(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch technician activity details.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to fetch technician activity details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, toast, router, refreshKey]);

  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      setRefreshKey(prevKey => prevKey + 1);
    }
  }, [searchParams]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteTechnicianActivity(id as string);
        toast({
          title: 'Activity Deleted',
          description: 'Activity has been successfully deleted.',
        });
        router.push(`/technician-activities/${activity?.activityType.toLowerCase()}s`); // Navigate back to list
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to delete activity.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to delete activity. Please try again.',
          variant: 'destructive',
        });
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
            <p className="mt-2 text-muted-foreground">Loading activity details...</p>
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
            <Button onClick={() => router.push('/technician-activities/installations')} className="mt-4">Back to Activities</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold">Activity not found.</p>
            <Button onClick={() => router.push('/technician-activities/installations')} className="mt-4">Back to Activities</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(`/technician-activities/${activity.activityType.toLowerCase()}s`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {activity.activityType}s
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity Details</h1>
              <p className="text-muted-foreground">Detailed view of the technician activity.</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/technician-activities/${activity._id}/edit`}>
                Edit Activity
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Activity
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto"> {/* Centered content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activity.activityType === 'Installation' ? <Package className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                {activity.activityType} Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Basic Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="technician">Technician</Label>
                    <Input value={activity.technician} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activityType">Activity Type</Label>
                    <Input value={activity.activityType} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activityDate">Activity Date</Label>
                    <Input value={format(new Date(activity.activityDate), 'PPP')} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input value={activity.clientName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Client Phone</Label>
                    <Input value={activity.clientPhone} disabled />
                  </div>
                </div>
              </div>

              {/* Type-Specific Details */}
              {activity.activityType === 'Installation' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Installation Specifics
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installedEquipment">Installed Equipment</Label>
                    <Textarea value={activity.installedEquipment || 'N/A'} rows={2} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installationNotes">Installation Notes</Label>
                    <Textarea value={activity.installationNotes || 'N/A'} rows={3} disabled />
                  </div>
                </div>
              )}

              {activity.activityType === 'Support' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wrench className="h-4 w-4" />
                    Support Specifics
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueDescription">Issue Description</Label>
                    <Textarea value={activity.issueDescription || 'N/A'} rows={2} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="solutionProvided">Solution Provided</Label>
                    <Textarea value={activity.solutionProvided || 'N/A'} rows={3} disabled />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partsReplaced">Parts Replaced</Label>
                      <Input value={activity.partsReplaced || 'N/A'} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="configurationChanges">Configuration Changes</Label>
                      <Input value={activity.configurationChanges || 'N/A'} disabled />
                    </div>
                  </div>
                </div>
              )}

              {/* General Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  General Description
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea value={activity.description || 'N/A'} rows={3} disabled />
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  Timestamps
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="createdAt">Created At</Label>
                    <Input value={format(new Date(activity.createdAt), 'PPP p')} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="updatedAt">Last Updated</Label>
                    <Input value={format(new Date(activity.updatedAt), 'PPP p')} disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
