import { Building } from '@/types/building';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/buildings';

export const getBuildings = async (token: string): Promise<Building[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch buildings');
  }

  return response.json();
};