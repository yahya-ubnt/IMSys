'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getTechnicianActivityById, updateTechnicianActivity } from '@/lib/technicianActivityService';
import { TechnicianActivity } from '@/types/technician-activity';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function EditTechnicianActivityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    technician: '',
    activityType: '',
    clientName: '',
    clientPhone: '',
    activityDate: '',
    description: '',
    installedEquipment: '',
    installationNotes: '',
    issueDescription: '',
    solutionProvided: '',
    partsReplaced: '',
    configurationChanges: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }
      if (!id) {
        setError('Activity ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getTechnicianActivityById(id as string, token);
        setFormData({
          technician: data.technician,
          activityType: data.activityType,
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          activityDate: format(new Date(data.activityDate), 'yyyy-MM-dd'),
          description: data.description,
          installedEquipment: data.installedEquipment || '',
          installationNotes: data.installationNotes || '',
          issueDescription: data.issueDescription || '',
          solutionProvided: data.solutionProvided || '',
          partsReplaced: data.partsReplaced || '',
          configurationChanges: data.configurationChanges || '',
        });
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch activity details for editing.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to fetch activity details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, token, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, activityDate: date ? format(date, 'yyyy-MM-dd') : '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!token) {
      setError('Authentication token not found. Please log in.');
      setSubmitting(false);
      return;
    }

    try {
      const activityData: Partial<TechnicianActivity> = {
        technician: formData.technician,
        activityType: formData.activityType as 'Installation' | 'Support',
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        activityDate: new Date(formData.activityDate),
        description: formData.description,
      };

      if (activityData.activityType === 'Installation') {
        activityData.installedEquipment = formData.installedEquipment;
        activityData.installationNotes = formData.installationNotes;
      } else if (activityData.activityType === 'Support') {
        activityData.issueDescription = formData.issueDescription;
        activityData.solutionProvided = formData.solutionProvided;
        activityData.partsReplaced = formData.partsReplaced;
        activityData.configurationChanges = formData.configurationChanges;
      }

      await updateTechnicianActivity(id as string, activityData, token);
      toast({
        title: 'Activity Updated',
        description: 'Activity has been successfully updated.',
      });
      router.push(`/technician-activities/${id}?refresh=${Date.now()}`);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to update activity.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to update activity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading activity for editing...</p>
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

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Activity</h1>
            <p className="text-muted-foreground">Modify the details of this technician activity.</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Activity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technician">Technician Name</Label>
                  <Input
                    id="technician"
                    name="technician"
                    placeholder="e.g., John Doe"
                    value={formData.technician}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityType">Activity Type</Label>
                  <Select name="activityType" value={formData.activityType} onValueChange={(value) => handleSelectChange('activityType', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Installation">Installation</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    placeholder="e.g., Jane Smith"
                    value={formData.clientName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input
                    id="clientPhone"
                    name="clientPhone"
                    placeholder="e.g., +254712345678"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityDate">Activity Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.activityDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.activityDate ? format(new Date(formData.activityDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.activityDate ? new Date(formData.activityDate) : undefined}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">General Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Installed new internet connection for client"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>

              {formData.activityType === 'Installation' && (
                <div className="space-y-2">
                  <Label htmlFor="installedEquipment">Installed Equipment</Label>
                  <Input
                    id="installedEquipment"
                    name="installedEquipment"
                    placeholder="e.g., Router X, ONU Y"
                    value={formData.installedEquipment}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {formData.activityType === 'Installation' && (
                <div className="space-y-2">
                  <Label htmlFor="installationNotes">Installation Notes</Label>
                  <Textarea
                    id="installationNotes"
                    name="installationNotes"
                    placeholder="e.g., Configured Wi-Fi, tested speed, client signed off"
                    value={formData.installationNotes}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>
              )}

              {formData.activityType === 'Support' && (
                <div className="space-y-2">
                  <Label htmlFor="issueDescription">Issue Description</Label>
                  <Textarea
                    id="issueDescription"
                    name="issueDescription"
                    placeholder="e.g., Client's router was misconfigured"
                    value={formData.issueDescription}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>
              )}

              {formData.activityType === 'Support' && (
                <div className="space-y-2">
                  <Label htmlFor="solutionProvided">Solution Provided</Label>
                  <Textarea
                    id="solutionProvided"
                    name="solutionProvided"
                    placeholder="e.g., Reconfigured router, updated firmware"
                    value={formData.solutionProvided}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>
              )}

              {formData.activityType === 'Support' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partsReplaced">Parts Replaced (Optional)</Label>
                    <Input
                      id="partsReplaced"
                      name="partsReplaced"
                      placeholder="e.g., Faulty PSU, Cable"
                      value={formData.partsReplaced}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="configurationChanges">Configuration Changes (Optional)</Label>
                    <Input
                      id="configurationChanges"
                      name="configurationChanges"
                      placeholder="e.g., Changed Wi-Fi password"
                      value={formData.configurationChanges}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/technician-activities/${id}`)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Activity'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
