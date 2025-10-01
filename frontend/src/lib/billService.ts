import { Bill } from '@/types/bill';

const API_BASE_URL = '/api/bills';

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

export const getBills = async (token: string, month?: number, year?: number): Promise<Bill[]> => {
  let url = API_BASE_URL;
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  if (params.toString()) url += `?${params.toString()}`;

  return fetchApi<Bill[]>(url, { token });
};

export const getBillById = async (id: string, token: string): Promise<Bill> => {
  return fetchApi<Bill>(`${API_BASE_URL}/${id}`, { token });
};

export const createBill = async (billData: Omit<Bill, '_id' | 'status' | 'paymentDate' | 'method' | 'transactionMessage' | 'month' | 'year' | 'createdAt' | 'updatedAt' | 'user'>, token: string): Promise<Bill> => {
  return fetchApi<Bill>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(billData),
    token,
  });
};

export const updateBill = async (id: string, billData: Partial<Omit<Bill, '_id' | 'month' | 'year' | 'createdAt' | 'updatedAt' | 'user' | 'category' | 'name' | 'amount' | 'dueDate'>>, token: string): Promise<Bill> => {
  return fetchApi<Bill>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(billData),
    token,
  });
};

export const deleteBill = async (id: string, token: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    token,
  });
};