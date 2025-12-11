import { Transaction } from '@/types/transaction';

const API_BASE_URL = '/api/daily-transactions';

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { headers, ...options, credentials: 'include' });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

export const getTransactions = async (params: string = '', category?: string): Promise<Transaction[]> => {
  let url = params ? `${API_BASE_URL}?${params}` : API_BASE_URL;
  if (category) {
    url = url.includes('?') ? `${url}&category=${category}` : `${url}?category=${category}`;
  }
  return fetchApi<Transaction[]>(url);
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  return fetchApi<Transaction>(`${API_BASE_URL}/${id}`);
};

export const createTransaction = async (dailyTransactionData: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
  return fetchApi<Transaction>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(dailyTransactionData),
  });
};

export const updateTransaction = async (id: string, dailyTransactionData: Partial<Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction> => {
  return fetchApi<Transaction>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dailyTransactionData),
  });
};

export const deleteTransaction = async (id: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
};

export const getTransactionStats = async (category?: string): Promise<{ today: number; thisWeek: number; thisMonth: number; thisYear: number }> => {
  const url = category ? `${API_BASE_URL}/stats?category=${category}` : `${API_BASE_URL}/stats`;
  return fetchApi<{ today: number; thisWeek: number; thisMonth: number; thisYear: number }>(url);
};

export const getMonthlyTransactionTotals = async (year: string, category?: string): Promise<{ month: number; total: number }[]> => {
  let url = `${API_BASE_URL}/monthly-totals?year=${year}`;
  if (category) {
    url = `${url}&category=${category}`;
  }
  return fetchApi<{ month: number; total: number }[]>(url);
};
