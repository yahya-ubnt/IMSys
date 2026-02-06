'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTicketById, updateTicket, addNoteToTicket } from '@/lib/ticketService';

import { Ticket, TicketFormData } from '@/types/ticket';

import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, MessageSquare } from 'lucide-react';

// --- TYPE DEFINITIONS ---

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
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Ticket ID is missing.');
        setLoading(false);
        return;
      }
      try {
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
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to fetch data.';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: `${errorMessage} Please try again.`,
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
      const updatedTicketData: Ticket = {
        ...ticket,
        ...formData,
        issueType: formData.issueType as Ticket['issueType'],
        status: formData.status as Ticket['status'],
        priority: formData.priority as Ticket['priority'],
      };

      await updateTicket(ticket._id, updatedTicketData);
      toast({
        title: 'Ticket Updated',
        description: 'Ticket has been successfully updated.',
      });
      router.push(`/tickets`);
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : 'Failed to update ticket.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `${errorMessage} Please try again.`,
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
      const errorMessage = (err instanceof Error) ? err.message : 'Failed to add note.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `${errorMessage} Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const selectableStatuses: Ticket['status'][] = ["In Progress", "Dispatched", "Resolved", "Closed"];

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-2 text-zinc-400">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-zinc-800 p-8 rounded-lg shadow-lg">
            <p className="text-lg font-semibold text-red-500">Error: {error}</p>
            <Button onClick={() => router.push('/tickets')} className="mt-4 bg-red-600 hover:bg-red-700 text-white">Back to Tickets</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit Ticket: {ticket?.ticketRef}</h1>
            <p className="text-sm text-zinc-400">Modify the details of this support ticket.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/tickets')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-4xl mx-auto">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400">Ticket Details</CardTitle>
              <CardDescription className="text-zinc-400">Update the ticket information below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="clientName" className="text-zinc-300">Client Name</Label><Input id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} required disabled className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="clientPhone" className="text-zinc-300">Client Phone</Label><Input id="clientPhone" name="clientPhone" value={formData.clientPhone} onChange={handleChange} required disabled className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="clientEmail" className="text-zinc-300">Client Email</Label><Input id="clientEmail" name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} disabled className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="clientAccountId" className="text-zinc-300">Client Account ID</Label><Input id="clientAccountId" name="clientAccountId" value={formData.clientAccountId} onChange={handleChange} disabled className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2"><Label htmlFor="issueType" className="text-zinc-300">Issue Type</Label><Input id="issueType" name="issueType" value={formData.issueType} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" /></div>
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-zinc-300">Priority</Label>
                    <Select name="priority" value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-zinc-300">Status</Label>
                    <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {ticket && (ticket.status === 'New' || ticket.status === 'Open') && (
                          <SelectItem value={ticket.status} disabled>
                            {ticket.status === 'Open' ? 'Opened' : 'New'}
                          </SelectItem>
                        )}
                        {selectableStatuses.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            disabled={ticket?.status === status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} required className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500" />
                </div>
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push('/tickets')} disabled={submitting} className="bg-transparent border-zinc-700 hover:bg-zinc-800">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    {submitting ? 'Updating...' : 'Update Ticket'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Add Note Section */}
        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-4xl mx-auto">
            <Card className="bg-transparent border-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <MessageSquare className="h-5 w-5" />
                    Add New Note
                    </CardTitle>
                    <CardDescription className="text-zinc-400">Add a new note to this ticket.</CardDescription>
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
                        className="bg-zinc-800 border-zinc-700 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={noteSubmitting} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {noteSubmitting ? 'Adding...' : 'Add Note'}
                        </Button>
                    </div>
                    </form>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
