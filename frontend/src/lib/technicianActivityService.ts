import { TechnicianActivity } from '@/types/technician-activity';

const API_BASE_URL = '/api/technician-activities';

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { headers, ...options, credentials: 'include' });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

export const getTechnicianActivities = async (filters?: {
  technicianId?: string;
  activityType?: 'Installation' | 'Support';
  startDate?: string;
  endDate?: string;
  clientName?: string;
  clientPhone?: string;
}): Promise<TechnicianActivity[]> => {
  let url = API_BASE_URL;
  const params = new URLSearchParams();
  if (filters) {
    for (const key in filters) {
      if (filters[key as keyof typeof filters]) {
        params.append(key, filters[key as keyof typeof filters] as string);
      }
    }
  }
  if (params.toString()) url += `?${params.toString()}`;

  return fetchApi<TechnicianActivity[]>(url);
};

export const getTechnicianActivityById = async (id: string): Promise<TechnicianActivity> => {
  return fetchApi<TechnicianActivity>(`${API_BASE_URL}/${id}`);
};

export const createTechnicianActivity = async (activityData: Omit<TechnicianActivity, '_id' | 'createdAt' | 'updatedAt'>): Promise<TechnicianActivity> => {
  return fetchApi<TechnicianActivity>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
};

export const updateTechnicianActivity = async (id: string, activityData: Partial<Omit<TechnicianActivity, '_id' | 'createdAt' | 'updatedAt'>>): Promise<TechnicianActivity> => {
  return fetchApi<TechnicianActivity>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activityData),
  });
};

export const deleteTechnicianActivity = async (id: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
};