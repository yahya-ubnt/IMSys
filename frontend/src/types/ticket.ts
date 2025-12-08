import { User } from './users';

export interface Ticket {
  _id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAccountId?: string;
  issueType: string;
  description: string;
  status: 'New' | 'Open' | 'In Progress' | 'Dispatched' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  ticketRef: string;
  createdBy: User;
  assignedTo?: User;
  statusHistory: {
    status: string;
    timestamp: string;
    updatedBy: User;
  }[];
  notes: {
    content: string;
    timestamp: string;
    addedBy: User;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketFormData {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAccountId: string;
  issueType: string;
  description: string;
  status: 'New' | 'Open' | 'In Progress' | 'Dispatched' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface TicketsResponse {
  tickets: Ticket[];
  pages: number;
  count: number;
}