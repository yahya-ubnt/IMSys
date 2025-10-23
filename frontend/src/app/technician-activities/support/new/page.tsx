'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createTechnicianActivity } from '@/lib/technicianActivityService';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getBuildings } from '@/lib/buildingService';
import { Building } from '@/types/building';

export default function AddNewSupportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [buildings, setBuildings] = useState<Building[]>([]);

  interface SupportFormData {
    technician: string;
    clientName: string;
    clientPhone: string;
    activityDate: string;
    description: string;
    issueDescription: string;
    solutionProvided: string;
    partsReplaced: string;
    configurationChanges: string;
    supportCategory: "Client Problem" | "Building Issue" | "";
    building: string;
    status: string;
    activityType: "Installation" | "Support";
  }

  const [formData, setFormData] = useState<SupportFormData>({
    technician: '',
    clientName: '',
    clientPhone: '',
    activityDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    issueDescription: '',
    solutionProvided: '',
    partsReplaced: '',
    configurationChanges: '',
    supportCategory: '',
    building: '',
    status: 'Pending',
    activityType: 'Support',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const buildingsData = await getBuildings();
        setBuildings(buildingsData);
      } catch (error) {
        console.error("Failed to fetch buildings", error);
      }
    };
    fetchBuildings();
  }, []);

  const handleSupportCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      supportCategory: value as "Client Problem" | "Building Issue" | "",
      building: '',
      clientName: '',
      clientPhone: '',
    });
  };

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

    try {
      const activityData = {
        ...formData,
        activityType: 'Support' as const,
        activityDate: new Date(formData.activityDate),
        supportCategory: formData.supportCategory === "" ? undefined : formData.supportCategory,
      };
      await createTechnicianActivity(activityData);
      toast({
        title: 'Support Activity Added',
        description: 'New support activity has been successfully recorded.',
      });
      router.push('/technician-activities/support');
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to add support activity.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to add support activity. Please try again.',
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
            <Button variant="outline" onClick={() => router.push('/technician-activities/support')} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Support Activities
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-400">Add New Support Activity</h1>
              <p className="text-zinc-400">Record a new technician support activity.</p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-blue-400">Support Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supportCategory" className="text-zinc-300">Support Category</Label>
                    <Select onValueChange={handleSupportCategoryChange} value={formData.supportCategory}>
                      <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 rounded-lg">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                        <SelectItem value="Client Problem" className="focus:bg-zinc-700 focus:text-white">Client Problem</SelectItem>
                        <SelectItem value="Building Issue" className="focus:bg-zinc-700 focus:text-white">Building Issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.supportCategory && (
                  <>
                    {formData.supportCategory === 'Client Problem' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clientName" className="text-zinc-300">Client Name</Label>
                            <Input
                              id="clientName"
                              name="clientName"
                              placeholder="e.g., John Smith"
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
                        </div>
                      </>
                    )}

                    {formData.supportCategory === 'Building Issue' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="building" className="text-zinc-300">Building</Label>
                            <Select onValueChange={(value) => setFormData({ ...formData, building: value })} value={formData.building}>
                              <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 rounded-lg">
                                <SelectValue placeholder="Select a building" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                                {buildings.map(building => (
                                  <SelectItem key={building._id} value={building._id} className="focus:bg-zinc-700 focus:text-white">{building.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="technician" className="text-zinc-300">Technician Name</Label>
                        <Input
                          id="technician"
                          name="technician"
                          placeholder="e.g., Jane Doe"
                          value={formData.technician}
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
                      <Label htmlFor="status" className="text-zinc-300">Status</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, status: value })} value={formData.status}>
                        <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 rounded-lg">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                          <SelectItem value="Pending" className="focus:bg-zinc-700 focus:text-white">Pending</SelectItem>
                          <SelectItem value="Tech Dispatched" className="focus:bg-zinc-700 focus:text-white">Tech Dispatched</SelectItem>
                          <SelectItem value="Fixed" className="focus:bg-zinc-700 focus:text-white">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-zinc-300">General Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="e.g., Client reported no internet connection"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        required
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issueDescription" className="text-zinc-300">Issue Description</Label>
                      <Textarea
                        id="issueDescription"
                        name="issueDescription"
                        placeholder="e.g., Client's router was misconfigured"
                        value={formData.issueDescription}
                        onChange={handleChange}
                        rows={3}
                        required
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="solutionProvided" className="text-zinc-300">Solution Provided</Label>
                      <Textarea
                        id="solutionProvided"
                        name="solutionProvided"
                        placeholder="e.g., Reconfigured router, updated firmware"
                        value={formData.solutionProvided}
                        onChange={handleChange}
                        rows={3}
                        required
                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="partsReplaced" className="text-zinc-300">Parts Replaced (Optional)</Label>
                        <Input
                          id="partsReplaced"
                          name="partsReplaced"
                          placeholder="e.g., Faulty PSU, Cable"
                          value={formData.partsReplaced}
                          onChange={handleChange}
                          className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="configurationChanges" className="text-zinc-300">Configuration Changes (Optional)</Label>
                        <Input
                          id="configurationChanges"
                          name="configurationChanges"
                          placeholder="e.g., Changed Wi-Fi password"
                          value={formData.configurationChanges}
                          onChange={handleChange}
                          className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {formData.supportCategory && (
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push('/technician-activities/support')} disabled={loading} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                      {loading ? 'Adding...' : 'Add Support Activity'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
