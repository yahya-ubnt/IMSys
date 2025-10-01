import { Unit } from '@/types/unit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/units';

export const getUnits = async (token: string): Promise<Unit[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch units');
  }

  return response.json();
};