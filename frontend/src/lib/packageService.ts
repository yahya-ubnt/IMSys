import { Package } from '@/types/package';

const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/mikrotik/packages` : 'http://localhost:5000/api/mikrotik/packages';

export const getPackages = async (): Promise<Package[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch packages');
  }

  return response.json();
};
