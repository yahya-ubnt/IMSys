import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket } from '@/types/ticket'; // Assuming Ticket type is defined
import { Badge } from "@/components/ui/badge"

interface TicketColumnsProps {
  onUpdateStatus: (id: string, status: Ticket['status']) => void;
  onDeleteTicket: (id: string) => void;
}

export const getTicketColumns = ({ onUpdateStatus, onDeleteTicket }: TicketColumnsProps): ColumnDef<Ticket>[] => [
  {
    accessorKey: 'ticketRef',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Reference
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link href={`/tickets/${row.original._id}`} className="font-medium text-blue-400 hover:underline">
        {row.original.ticketRef}
      </Link>
    ),
  },
  {
    accessorKey: 'clientName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Client Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'clientPhone',
    header: "Client Phone",
  },
  {
    accessorKey: 'issueType',
    header: "Issue Type",
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      let statusColor = '';
      switch (status) {
        case 'New':
          statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
          break;
        case 'Open':
          statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
          break;
        case 'In Progress':
          statusColor = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
          break;
        case 'Dispatched':
          statusColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
          break;
        case 'Resolved':
          statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
          break;
        case 'Closed':
          statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
          break;
        default:
          statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      }
      return <Badge variant="outline" className={`capitalize ${statusColor}`}>{status === 'Open' ? 'Opened' : status}</Badge>;
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string;
      let priorityColor = '';
      switch (priority) {
        case 'Low':
          priorityColor = 'text-green-400';
          break;
        case 'Medium':
          priorityColor = 'text-yellow-400';
          break;
        case 'High':
          priorityColor = 'text-orange-400';
          break;
        case 'Urgent':
          priorityColor = 'text-red-400';
          break;
        default:
          priorityColor = 'text-gray-400';
      }
      return (
        <span className={`font-medium ${priorityColor}`}>
          {priority}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return date.toLocaleString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const ticket = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 text-white border-zinc-700">
            <DropdownMenuItem asChild>
              <Link href={`/tickets/${ticket._id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tickets/${ticket._id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            {ticket.status === 'Open' && (
              <DropdownMenuItem onClick={() => onUpdateStatus(ticket._id, 'In Progress')}>
                Mark as In Progress
              </DropdownMenuItem>
            )}
            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
              <DropdownMenuItem onClick={() => onUpdateStatus(ticket._id, 'Resolved')}>
                Mark as Resolved
              </DropdownMenuItem>
            )}
            {ticket.status !== 'Closed' && (
              <DropdownMenuItem onClick={() => onUpdateStatus(ticket._id, 'Closed')}>
                Close Ticket
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem onClick={() => onDeleteTicket(ticket._id)} className="text-red-400 focus:text-red-400 focus:bg-red-500/20">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
