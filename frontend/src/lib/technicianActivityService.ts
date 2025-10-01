import { TechnicianActivity } from '@/types/technician-activity';

const API_BASE_URL = '/api/technician-activities';

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

export const getTechnicianActivities = async (token: string, filters?: {
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

  return fetchApi<TechnicianActivity[]>(url, { token });
};

export const getTechnicianActivityById = async (id: string, token: string): Promise<TechnicianActivity> => {
  return fetchApi<TechnicianActivity>(`${API_BASE_URL}/${id}`, { token });
};

export const createTechnicianActivity = async (activityData: Omit<TechnicianActivity, '_id' | 'createdAt' | 'updatedAt'>, token: string): Promise<TechnicianActivity> => {
  return fetchApi<TechnicianActivity>(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(activityData),
    token,
  });
};

export const updateTechnicianActivity = async (id: string, activityData: Partial<Omit<TechnicianActivity, '_id' | 'createdAt' | 'updatedAt'>>, token: string): Promise<TechnicianActivity> => {
  return fetchApi<TechnicianActivity>(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activityData),
    token,
  });
};

export const deleteTechnicianActivity = async (id: string, token: string): Promise<{ message: string }> => {
  return fetchApi<{ message: string }>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    token,
  });
};