import { CaretakerAgent } from '@/types/caretaker-agent';

const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/caretakeragents` : 'http://localhost:5000/api/caretakeragents';

export const getCaretakerAgents = async (token: string): Promise<CaretakerAgent[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch caretaker agents');
  }

  return response.json();
};