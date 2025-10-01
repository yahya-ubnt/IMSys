interface FetchOptions extends RequestInit {
  token?: string;
}

import { Ticket } from '@/types/ticket';

async function fetchApi<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...restOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, { headers, ...restOptions });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

// Create a new ticket
export const createTicket = async (ticketData: Ticket, token: string) => {
  return fetchApi('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
    token,
  });
};

// Get all tickets
export const getTickets = async (token: string, params?: string) => {
  const url = params ? `/api/tickets?${params}` : '/api/tickets';
  return fetchApi<Ticket[]>(url, { token });
};

// Get a single ticket by ID
export const getTicketById = async (id: string, token: string) => {
  return fetchApi<Ticket>(`/api/tickets/${id}`, { token });
};

// Update a ticket
export const updateTicket = async (id: string, ticketData: Ticket, token: string) => {
  return fetchApi(`/api/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ticketData),
    token,
  });
};

// Add a note to a ticket
export const addNoteToTicket = async (id: string, content: string, token: string) => {
  return fetchApi(`/api/tickets/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    token,
  });
};

// Delete a ticket (if needed, not explicitly in spec but common)
export const deleteTicket = async (id: string, token: string) => {
  return fetchApi(`/api/tickets/${id}`, {
    method: 'DELETE',
    token,
  });
};

// Get ticket statistics
export const getTicketStats = async (token: string) => {
  return fetchApi('/api/tickets/stats', {
    method: 'GET',
    token,
  });
};

// Get monthly ticket totals
export const getMonthlyTicketTotals = async (year: string, token: string) => {
  return fetchApi<{ month: string; count: number; }[]>(`/api/tickets/monthly-totals?year=${year}`, {
    method: 'GET',
    token,
  });
};
