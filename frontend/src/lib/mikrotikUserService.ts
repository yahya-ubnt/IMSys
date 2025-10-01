interface FetchOptions extends RequestInit {
  token?: string;
}

import { MikrotikUser } from '@/app/mikrotik/users/page'; // Add this line

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

// Get all Mikrotik Users
export const getMikrotikUsers = async (token: string) => {
  return fetchApi<MikrotikUser[]>('/api/mikrotik/users', {
    method: 'GET',
    token,
  });
};
