export interface Ticket {
  _id: string;
  ticketRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAccountId?: string;
  issueType: 'Incorrect Bill' | 'Payment Not Reflected' | 'Service Suspension' | 'Other';
  description: string;
  status: 'New' | 'Open' | 'In Progress' | 'Dispatched' | 'Fixed' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: { _id: string; fullName: string; email: string }; // Populated User
  createdBy: { _id: string; fullName: string; email: string }; // Populated User
  statusHistory: Array<{
    status: 'New' | 'Open' | 'In Progress' | 'Dispatched' | 'Fixed' | 'Closed';
    timestamp: string;
    updatedBy: { _id: string; fullName: string; email: string }; // Populated User
  }>;
  notes: Array<{
    content: string;
    timestamp: string;
    addedBy: { _id: string; fullName: string; email: string }; // Populated User
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TicketFormData {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAccountId?: string;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
}