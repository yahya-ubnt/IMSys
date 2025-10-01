import { Lead, DashboardStatsProps, MonthlyLeadData, MikrotikUserDetails } from '@/types/lead';

const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/leads` : 'http://localhost:5000/api/leads';

export const getLeads = async (token: string, year?: string): Promise<{ leads: Lead[], dashboardStats: DashboardStatsProps, chartData: MonthlyLeadData[] }> => {
  const url = year ? `${API_URL}?year=${year}` : API_URL;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch leads');
  }

  return response.json();
};

export const updateLeadStatus = async (token: string, leadId: string, status: string, createMikrotikUser: boolean, mikrotikDetails?: MikrotikUserDetails): Promise<Lead> => {
  const response = await fetch(`${API_URL}/status/${leadId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, createMikrotikUser, ...mikrotikDetails }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update lead status');
  }

  return response.json();
};