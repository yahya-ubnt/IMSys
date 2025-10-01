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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Client Phone
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'issueType',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Issue Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
      const status = row.getValue('status');
      let statusColor = '';
      switch (status) {
        case 'New':
          statusColor = 'bg-blue-100 text-blue-800';
          break;
        case 'Open':
          statusColor = 'bg-yellow-100 text-yellow-800';
          break;
        case 'In Progress':
          statusColor = 'bg-orange-100 text-orange-800';
          break;
        case 'Dispatched':
          statusColor = 'bg-purple-100 text-purple-800';
          break;
        case 'Fixed':
          statusColor = 'bg-green-100 text-green-800';
          break;
        case 'Closed':
          statusColor = 'bg-gray-100 text-gray-800';
          break;
        default:
          statusColor = 'bg-gray-100 text-gray-800';
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {status as string}
        </span>
      );
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
      const priority = row.getValue('priority');
      let priorityColor = '';
      switch (priority) {
        case 'Low':
          priorityColor = 'text-green-600';
          break;
        case 'Medium':
          priorityColor = 'text-yellow-600';
          break;
        case 'High':
          priorityColor = 'text-orange-600';
          break;
        case 'Urgent':
          priorityColor = 'text-red-600';
          break;
        default:
          priorityColor = 'text-gray-600';
      }
      return (
        <span className={`font-medium ${priorityColor}`}>
          {priority as string}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/tickets/${ticket._id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tickets/${ticket._id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus(ticket._id, 'Resolved')}>
              Mark as Fixed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteTicket(ticket._id)} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
