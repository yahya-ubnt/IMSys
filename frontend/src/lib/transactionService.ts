import { Transaction } from '@/types/transaction';

const API_BASE_URL = '/api/daily-transactions';

interface FetchOptions extends RequestInit {
  token?: string;
}

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

export const getTransactions = async (token: string, params: string = '', category?: string): Promise<Transaction[]> => {
  let url = params ? `${API_BASE_URL}?${params}` : API_BASE_URL;
  if (category) {
    url = url.includes('?') ? `${url}&category=${category}` : `${url}?category=${category}`;
  }
  return fetchApi<Transaction[]>(url, { token });
};

export const getTransactionById = async (id: string, token: string): Promise<Transaction> => {
  return fetchApi<Transaction>(`${API_BASE_URL}/${id}`, { token });
};

export const createTransaction = async (dailyTransactionData: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>, token: string): Promise<Transaction> => {
  return fetchApi<Transaction>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(dailyTransactionData),
    token,
  });
};

export const updateTransaction = async (id: string, dailyTransactionData: Partial<Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>>, token: string): Promise<Transaction> => {
  return fetchApi<Transaction>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dailyTransactionData),
    token,
  });
};

export const deleteTransaction = async (id: string, token: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    token,
  });
};

export const getTransactionStats = async (token: string, category?: string): Promise<{ today: number; thisWeek: number; thisMonth: number; thisYear: number }> => {
  const url = category ? `${API_BASE_URL}/stats?category=${category}` : `${API_BASE_URL}/stats`;
  return fetchApi<{ today: number; thisWeek: number; thisMonth: number; thisYear: number }>(url, { token });
};

export const getMonthlyTransactionTotals = async (year: string, token: string, category?: string): Promise<{ month: number; total: number }[]> => {
  let url = `${API_BASE_URL}/monthly-totals?year=${year}`;
  if (category) {
    url = `${url}&category=${category}`;
  }
  return fetchApi<{ month: number; total: number }[]>(url, { token });
};
