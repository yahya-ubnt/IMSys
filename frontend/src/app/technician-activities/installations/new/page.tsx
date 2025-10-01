'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { createTechnicianActivity } from '@/lib/technicianActivityService';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function AddNewInstallationPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  interface InstallationFormData {
    technician: string;
    clientName: string;
    clientPhone: string;
    activityDate: string;
    description: string;
    installedEquipment: string;
    installationNotes: string;
    activityType: "Installation";
  }

  const [formData, setFormData] = useState<InstallationFormData>({
    technician: '',
    clientName: '',
    clientPhone: '',
    activityDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    installedEquipment: '',
    installationNotes: '',
    activityType: 'Installation',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, activityDate: date ? format(date, 'yyyy-MM-dd') : '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const activityData = {
        ...formData,
        activityType: formData.activityType as "Installation",
        activityDate: new Date(formData.activityDate),
      };
      await createTechnicianActivity(activityData, token);
      toast({
        title: 'Installation Added',
        description: 'New installation activity has been successfully recorded.',
      });
      router.push('/technician-activities/installations');
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to add installation activity.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to add installation activity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/technician-activities/installations')} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Installations
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-400">Add New Installation</h1>
              <p className="text-zinc-400">Record a new technician installation activity.</p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-blue-400">Installation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="technician" className="text-zinc-300">Technician Name</Label>
                    <Input
                      id="technician"
                      name="technician"
                      placeholder="e.g., John Doe"
                      value={formData.technician}
                      onChange={handleChange}
                      required
                      className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-zinc-300">Client Name</Label>
                    <Input
                      id="clientName"
                      name="clientName"
                      placeholder="e.g., Jane Smith"
                      value={formData.clientName}
                      onChange={handleChange}
                      required
                      className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="text-zinc-300">Client Phone</Label>
                    <Input
                      id="clientPhone"
                      name="clientPhone"
                      placeholder="e.g., +254712345678"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      required
                      className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activityDate" className="text-zinc-300">Activity Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
                            !formData.activityDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.activityDate ? format(new Date(formData.activityDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-zinc-900 text-white border-zinc-700">
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
                  <Label htmlFor="description" className="text-zinc-300">General Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="e.g., Installed new internet connection for client"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installedEquipment" className="text-zinc-300">Installed Equipment</Label>
                  <Input
                    id="installedEquipment"
                    name="installedEquipment"
                    placeholder="e.g., Router X, ONU Y"
                    value={formData.installedEquipment}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installationNotes" className="text-zinc-300">Installation Notes</Label>
                  <Textarea
                    id="installationNotes"
                    name="installationNotes"
                    placeholder="e.g., Configured Wi-Fi, tested speed, client signed off"
                    value={formData.installationNotes}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.push('/technician-activities/installations')} disabled={loading} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                    {loading ? 'Adding...' : 'Add Installation'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
