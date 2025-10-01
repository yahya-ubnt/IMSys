import { DailyTransaction } from '@/types/daily-transaction';

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

export const getDailyTransactions = async (token: string, params: string = ''): Promise<DailyTransaction[]> => {
  const url = params ? `${API_BASE_URL}?${params}` : API_BASE_URL;
  return fetchApi<DailyTransaction[]>(url, { token });
};

export const getDailyTransactionById = async (id: string, token: string): Promise<DailyTransaction> => {
  return fetchApi<DailyTransaction>(`${API_BASE_URL}/${id}`, { token });
};

export const createDailyTransaction = async (dailyTransactionData: Omit<DailyTransaction, '_id' | 'createdAt' | 'updatedAt'>, token: string): Promise<DailyTransaction> => {
  return fetchApi<DailyTransaction>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(dailyTransactionData),
    token,
  });
};

export const updateDailyTransaction = async (id: string, dailyTransactionData: Partial<Omit<DailyTransaction, '_id' | 'createdAt' | 'updatedAt'>>, token: string): Promise<DailyTransaction> => {
  return fetchApi<DailyTransaction>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dailyTransactionData),
    token,
  });
};

export const deleteDailyTransaction = async (id: string, token: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    token,
  });
};

export const getDailyTransactionStats = async (token: string): Promise<{
  today: { personal: number; company: number; total: number };
  thisWeek: { personal: number; company: number; total: number };
  thisMonth: { personal: number; company: number; total: number };
  thisYear: { personal: number; company: number; total: number };
}> => {
  return fetchApi<{
    today: { personal: number; company: number; total: number };
    thisWeek: { personal: number; company: number; total: number };
    thisMonth: { personal: number; company: number; total: number };
    thisYear: { personal: number; company: number; total: number };
  }>(`${API_BASE_URL}/stats`, { token });
};

export const getMonthlyTransactionTotals = async (year: string, token: string): Promise<{ month: number; total: number }[]> => {
  return fetchApi<{ month: number; total: number }[]>(`${API_BASE_URL}/monthly-totals?year=${year}`, { token });
};
