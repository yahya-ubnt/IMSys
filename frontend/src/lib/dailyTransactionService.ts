import { DailyTransaction } from '@/types/daily-transaction';

const API_BASE_URL = '/api/daily-transactions';

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

export const getDailyTransactions = async (params: string = ''): Promise<DailyTransaction[]> => {
  const url = params ? `${API_BASE_URL}?${params}` : API_BASE_URL;
  return fetchApi<DailyTransaction[]>(url);
};

export const getDailyTransactionById = async (id: string): Promise<DailyTransaction> => {
  return fetchApi<DailyTransaction>(`${API_BASE_URL}/${id}`);
};

export const createDailyTransaction = async (dailyTransactionData: Omit<DailyTransaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<DailyTransaction> => {
  return fetchApi<DailyTransaction>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(dailyTransactionData),
  });
};

export const updateDailyTransaction = async (id: string, dailyTransactionData: Partial<Omit<DailyTransaction, '_id' | 'createdAt' | 'updatedAt'>>): Promise<DailyTransaction> => {
  return fetchApi<DailyTransaction>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dailyTransactionData),
  });
};

export const deleteDailyTransaction = async (id: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
};

export const getDailyTransactionStats = async (): Promise<{
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
  }>(`${API_BASE_URL}/stats`);
};

export const getMonthlyTransactionTotals = async (year: string): Promise<{ month: number; total: number }[]> => {
  return fetchApi<{ month: number; total: number }[]>(`${API_BASE_URL}/monthly-totals?year=${year}`);
};

