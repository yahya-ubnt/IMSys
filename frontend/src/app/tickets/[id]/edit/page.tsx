'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getTicketById, updateTicket, addNoteToTicket } from '@/lib/ticketService';

import { Ticket, TicketFormData } from '@/types/ticket';

import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function EditTicketPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<TicketFormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAccountId: '',
    issueType: '',
    description: '',
    status: 'New',
    priority: 'Medium',
  });
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket details and issue types on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Ticket ID is missing.');
        setLoading(false);
        return;
      }
      try {
        // Fetch ticket details
        const ticketData = await getTicketById(id as string);
        setTicket(ticketData);
        setFormData({
          clientName: ticketData.clientName,
          clientPhone: ticketData.clientPhone,
          clientEmail: ticketData.clientEmail || '',
          clientAccountId: ticketData.clientAccountId || '',
          issueType: ticketData.issueType,
          description: ticketData.description,
          status: ticketData.status,
          priority: ticketData.priority,
        });

      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch data.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to fetch data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!ticket) {
      setError('Ticket not loaded.');
      setSubmitting(false);
      return;
    }

    try {
      // Construct the full Ticket object from existing ticket data and form data
      const updatedTicketData: Ticket = {
        ...ticket, // Keep existing properties like _id, ticketRef, createdBy, statusHistory, notes, createdAt, updatedAt
        ...formData, // Override with form data
        // You might need to handle issueType, status, priority conversions if they are union types in Ticket
        issueType: formData.issueType as Ticket['issueType'],
        status: formData.status as Ticket['status'],
        priority: formData.priority as Ticket['priority'],
      };

      await updateTicket(ticket._id, updatedTicketData);
      toast({
        title: 'Ticket Updated',
        description: 'Ticket has been successfully updated.',
      });
      router.push(`/tickets/${ticket._id}`);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to update ticket.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to update ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteSubmitting(true);
    setError(null);

    if (!ticket || !noteContent.trim()) {
      setError('Ticket not loaded or note is empty.');
      setNoteSubmitting(false);
      return;
    }

    try {
      await addNoteToTicket(ticket._id, noteContent);
      toast({
        title: 'Note Added',
        description: 'Note has been successfully added to the ticket.',
      });
      setNoteContent('');
      const updatedTicket = await getTicketById(ticket._id);
      setTicket(updatedTicket);
    } catch (err: unknown) {
      setError((err instanceof Error) ? err.message : 'Failed to add note.');
      toast({
        title: 'Error',
        description: (err instanceof Error) ? err.message : 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setNoteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading ticket for editing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">Error: {error}</p>
            <Button onClick={() => router.push('/tickets')} className="mt-4 bg-red-600 hover:bg-red-700 text-white">Back to Tickets</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-400">Ticket not found.</p>
            <Button onClick={() => router.push('/tickets')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Back to Tickets</Button>
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
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push(`/tickets/${ticket._id}`)} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-blue-400">Edit Ticket: {ticket.ticketRef}</h1>
              <p className="text-sm text-zinc-400">Modify the details of this ticket.</p>
            </div>
          </div>
        </div>

        <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
          <CardHeader className="border-b border-zinc-700 pb-4">
            <CardTitle className="text-cyan-400">Edit Ticket Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-zinc-300">Client Name</Label>
                  <Input
                    id="clientName"
                    name="clientName"
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
                    value={formData.clientPhone}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-zinc-300">Client Email (Optional)</Label>
                  <Input
                    id="clientEmail"
                    name="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAccountId" className="text-zinc-300">Client Account ID (Optional)</Label>
                  <Input
                    id="clientAccountId"
                    name="clientAccountId"
                    value={formData.clientAccountId}
                    onChange={handleChange}
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueType" className="text-zinc-300">Issue Type</Label>
                  <Input
                    id="issueType"
                    name="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    required
                    className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-zinc-300">Priority</Label>
                  <Select name="priority" value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                    <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                      <SelectValue placeholder="Select priority" className="text-zinc-400" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                      <SelectItem value="Low" className="focus:bg-zinc-700 focus:text-white">Low</SelectItem>
                      <SelectItem value="Medium" className="focus:bg-zinc-700 focus:text-white">Medium</SelectItem>
                      <SelectItem value="High" className="focus:bg-zinc-700 focus:text-white">High</SelectItem>
                      <SelectItem value="Urgent" className="focus:bg-zinc-700 focus:text-white">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-zinc-300">Status</Label>
                  <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                      <SelectValue placeholder="Select status" className="text-zinc-400" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                      <SelectItem value="New" className="focus:bg-zinc-700 focus:text-white">New</SelectItem>
                      <SelectItem value="Open" className="focus:bg-zinc-700 focus:text-white">Open</SelectItem>
                      <SelectItem value="In Progress" className="focus:bg-zinc-700 focus:text-white">In Progress</SelectItem>
                      <SelectItem value="Dispatched" className="focus:bg-zinc-700 focus:text-white">Dispatched</SelectItem>
                      <SelectItem value="Fixed" className="focus:bg-zinc-700 focus:text-white">Fixed</SelectItem>
                      <SelectItem value="Closed" className="focus:bg-zinc-700 focus:text-white">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Assuming you have a way to get a list of users for assignment */}
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-300">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Client reports no internet connectivity since 10 AM."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/tickets/${ticket._id}`)} disabled={submitting} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                  {submitting ? 'Updating...' : 'Update Ticket'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Add Note Section */}
        <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
          <CardHeader className="border-b border-zinc-700 pb-4">
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Add New Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noteContent" className="text-zinc-300">Note Content</Label>
                <Textarea
                  id="noteContent"
                  name="noteContent"
                  placeholder="e.g., Called client, confirmed issue resolved. Closed ticket."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  required
                  className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={noteSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                  {noteSubmitting ? 'Adding Note...' : 'Add Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}