'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTicketById, deleteTicket } from '@/lib/ticketService';
import { Ticket } from '@/types/ticket';
import { Topbar } from '@/components/topbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Tag, FileText, CalendarIcon, User, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const DetailItem = ({ label, value }: { label: string, value: string | undefined | null }) => (
    <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <p className="text-base text-white">{value || 'N/A'}</p>
    </div>
);

export default function TicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) {
        setError('Ticket ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const data = await getTicketById(id as string);
        setTicket(data);
      } catch (err: unknown) {
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to fetch ticket details.';
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

    fetchTicket();
  }, [id, toast]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        await deleteTicket(id as string);
        toast({
          title: 'Ticket Deleted',
          description: 'Ticket has been successfully deleted.',
        });
        router.push('/tickets');
      } catch (err: unknown) {
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to delete ticket.';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: `${errorMessage} Please try again.`,
          variant: 'destructive',
        });
      }
    }
  };

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

  if (error || !ticket) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-zinc-800 p-8 rounded-lg shadow-lg">
            <p className="text-lg font-semibold text-red-500">{error || 'Ticket not found.'}</p>
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
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Ticket Details</h1>
            <p className="text-sm text-zinc-400">Viewing ticket {ticket.ticketRef}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/tickets')} className="bg-transparent border-zinc-700 hover:bg-zinc-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tickets
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
              <Link href={`/tickets/${ticket._id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-lg shadow-2xl shadow-blue-500/10 rounded-xl max-w-5xl mx-auto">
          <Card className="bg-transparent border-none">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center"><Tag className="mr-2"/>Ticket Information</CardTitle>
              <CardDescription className="text-zinc-400">All details related to this support ticket.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Ticket & Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem label="Ticket Reference" value={ticket.ticketRef} />
                <DetailItem label="Status" value={ticket.status} />
                <DetailItem label="Priority" value={ticket.priority} />
                <DetailItem label="Issue Type" value={ticket.issueType} />
                <DetailItem label="Created By" value={ticket.createdBy?.name} />
                <DetailItem label="Assigned To" value={ticket.assignedTo?.name} />
                <DetailItem label="Client Name" value={ticket.clientName} />
                <DetailItem label="Client Phone" value={ticket.clientPhone} />
                <DetailItem label="Client Email" value={ticket.clientEmail} />
                <DetailItem label="Client Account ID" value={ticket.clientAccountId} />
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center"><FileText className="mr-2"/>Description</h3>
                <p className="text-white bg-zinc-800 p-4 rounded-md">{ticket.description}</p>
              </div>

              {/* Status History */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center"><Clock className="mr-2"/>Status History</h3>
                <div className="border border-zinc-700 rounded-md">
                  {ticket.statusHistory.map((history, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 ${index < ticket.statusHistory.length - 1 ? 'border-b border-zinc-700' : ''}`}>
                      <div>
                        <span className="font-semibold text-white">{history.status}</span>
                        <span className="text-zinc-400 text-sm ml-2">by {history.updatedBy?.name || 'N/A'}</span>
                      </div>
                      <span className="text-zinc-400 text-sm">{format(new Date(history.timestamp), 'PPP p')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center"><MessageSquare className="mr-2"/>Notes</h3>
                <div className="space-y-4">
                  {ticket.notes.length > 0 ? (
                    ticket.notes.map((note, index) => (
                      <div key={index} className="bg-zinc-800 p-4 rounded-md">
                        <p className="text-white">{note.content}</p>
                        <p className="text-zinc-400 text-xs mt-2">
                          by {note.addedBy?.name || 'N/A'} on {format(new Date(note.timestamp), 'PPP p')}
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
      </main>
    </div>
  );
}