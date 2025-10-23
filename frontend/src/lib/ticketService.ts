import { Ticket } from '@/types/ticket';

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { headers, ...options });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

// Create a new ticket
export const createTicket = async (ticketData: Ticket) => {
  return fetchApi('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  });
};

// Get all tickets
export const getTickets = async (params?: string) => {
  const url = params ? `/api/tickets?${params}` : '/api/tickets';
  return fetchApi<Ticket[]>(url);
};

// Get a single ticket by ID
export const getTicketById = async (id: string) => {
  return fetchApi<Ticket>(`/api/tickets/${id}`);
};

// Update a ticket
export const updateTicket = async (id: string, ticketData: Ticket) => {
  return fetchApi(`/api/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ticketData),
  });
};

// Add a note to a ticket
export const addNoteToTicket = async (id: string, content: string) => {
  return fetchApi(`/api/tickets/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

// Delete a ticket (if needed, not explicitly in spec but common)
export const deleteTicket = async (id: string) => {
  return fetchApi(`/api/tickets/${id}`, {
    method: 'DELETE',
  });
};

// Get ticket statistics
export const getTicketStats = async () => {
  return fetchApi('/api/tickets/stats', {
    method: 'GET',
  });
};

// Get monthly ticket totals
export const getMonthlyTicketTotals = async (year: string) => {
  return fetchApi<{ month: string; count: number; }[]>(`/api/tickets/monthly-totals?year=${year}`, {
    method: 'GET',
  });
};
