'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getTicketById, deleteTicket } from '@/lib/ticketService'; // Import ticket service functions
import { Ticket } from '@/types/ticket'; // Import Ticket type
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, FileText, CalendarIcon, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }
      if (!id) {
        setError('Ticket ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getTicketById(id as string, token);
        setTicket(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to fetch ticket details.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to fetch ticket details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, token, toast]);

  const handleDelete = async () => {
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to delete a ticket.',
        variant: 'destructive',
      });
      return;
    }
    if (confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteTicket(id as string, token);
        toast({
          title: 'Ticket Deleted',
          description: 'Ticket has been successfully deleted.',
        });
        router.push('/tickets'); // Redirect to tickets list after deletion
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'Failed to delete ticket.');
        toast({
          title: 'Error',
          description: (err instanceof Error) ? err.message : 'Failed to delete ticket. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading ticket details...</p>
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
            <Button onClick={() => router.push('/tickets')} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tickets
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-blue-400">Ticket Details</h1>
              <p className="text-sm text-zinc-400">Detailed view of ticket {ticket.ticketRef}.</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
              <Link href={`/tickets/${ticket._id}/edit`}>
                Edit Ticket
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Ticket
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto"> {/* Centered content */}
          <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
            <CardHeader className="border-b border-zinc-700 pb-4">
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <FileText className="h-5 w-5 text-blue-400" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                  <Tag className="h-4 w-4 text-blue-400" />
                  Basic Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Reference Number</Label>
                    <Input value={ticket.ticketRef} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Status</Label>
                    <Input value={ticket.status} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Priority</Label>
                    <Input value={ticket.priority} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Issue Type</Label>
                    <Input value={ticket.issueType} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Created By</Label>
                    <Input value={ticket.createdBy?.name || 'N/A'} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Assigned To</Label>
                    <Input value={ticket.assignedTo?.name || 'N/A'} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                  <User className="h-4 w-4 text-blue-400" />
                  Client Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Client Name</Label>
                    <Input value={ticket.clientName} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Client Phone</Label>
                    <Input value={ticket.clientPhone} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Client Email</Label>
                    <Input value={ticket.clientEmail || 'N/A'} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Client Account ID</Label>
                    <Input value={ticket.clientAccountId || 'N/A'} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  Issue Description
                </div>
                <div className="space-y-2">
                  <Textarea value={ticket.description} rows={5} disabled className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500" />
                </div>
              </div>

              {/* Status History */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                  <CalendarIcon className="h-4 w-4 text-blue-400" />
                  Status History
                </div>
                <div className="space-y-2">
                  {ticket.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-center justify-between text-sm border-b pb-1 last:border-b-0 last:pb-0 border-zinc-700">
                      <span className="text-white">{history.status}</span>
                      <span className="text-zinc-400">{format(new Date(history.timestamp), 'PPP p')} by {history.updatedBy?.name || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  Notes
                </div>
                <div className="space-y-2">
                  {ticket.notes.length > 0 ? (
                    ticket.notes.map((note, index) => (
                      <div key={index} className="text-sm border-b pb-1 last:border-b-0 last:pb-0 border-zinc-700">
                        <p className="text-white">{note.content}</p>
                        <p className="text-zinc-400 text-xs mt-1">
                          {format(new Date(note.timestamp), 'PPP p')} by {note.addedBy?.name || 'N/A'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-sm">No notes for this ticket.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
