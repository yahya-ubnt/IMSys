// frontend/src/lib/api.ts

import { getCookie } from 'cookies-next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  isFormData?: boolean;
  body?: any;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: ApiOptions
): Promise<T> {
  const { token, isFormData, body, headers, ...customConfig } = options || {};

  const authToken = token || getCookie('token'); // Get token from props or cookie

  const config: RequestInit = {
    method: options?.method || 'GET',
    credentials: 'include', // Crucial for sending cookies with cross-origin requests
    ...customConfig,
    headers: {
      ...headers,
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
    },
  };

  if (body) {
    config.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

// Example usage (can be expanded with specific API functions)
// export const authApi = {
//   login: (credentials: any) => fetchApi('/users/login', { method: 'POST', body: credentials }),
//   getProfile: () => fetchApi('/users/profile'),
// };
