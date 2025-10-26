import { Bill } from '@/types/bill';

const API_BASE_URL = '/api/bills';

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers, credentials: 'include' });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

export const getBills = async (month?: number, year?: number): Promise<Bill[]> => {
  let url = API_BASE_URL;
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  if (params.toString()) url += `?${params.toString()}`;

  return fetchApi<Bill[]>(url);
};

export const getBillById = async (id: string): Promise<Bill> => {
  return fetchApi<Bill>(`${API_BASE_URL}/${id}`);
};

export const createBill = async (billData: Omit<Bill, '_id' | 'status' | 'paymentDate' | 'method' | 'transactionMessage' | 'month' | 'year' | 'createdAt' | 'updatedAt' | 'user'>): Promise<Bill> => {
  return fetchApi<Bill>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(billData),
  });
};

export const updateBill = async (id: string, billData: Partial<Omit<Bill, '_id' | 'month' | 'year' | 'createdAt' | 'updatedAt' | 'user' | 'category' | 'name' | 'amount' | 'dueDate'>>): Promise<Bill> => {
  return fetchApi<Bill>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(billData),
  });
};

export const deleteBill = async (id: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
};