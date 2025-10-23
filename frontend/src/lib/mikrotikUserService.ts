import { MikrotikUser } from '@/app/mikrotik/users/page'; // Add this line

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

// Get all Mikrotik Users
export const getMikrotikUsers = async () => {
  return fetchApi<MikrotikUser[]>('/api/mikrotik/users', {
    method: 'GET',
  });
};
