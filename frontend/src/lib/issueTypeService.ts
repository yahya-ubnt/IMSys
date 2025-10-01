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

// Create a new issue type
export const createIssueType = async (issueTypeData: { name: string; description?: string }, token: string) => {
  return fetchApi('/api/issue-types', {
    method: 'POST',
    body: JSON.stringify(issueTypeData),
    token,
  });
};

// Get all issue types
export const getIssueTypes = async (token: string) => {
  return fetchApi('/api/issue-types', {
    method: 'GET',
    token,
  });
};

// Get a single issue type by ID
export const getIssueTypeById = async (id: string, token: string) => {
  return fetchApi(`/api/issue-types/${id}`, {
    method: 'GET',
    token,
  });
};

// Update an issue type
export const updateIssueType = async (id: string, issueTypeData: { name?: string; description?: string; status?: 'Active' | 'Inactive' }, token: string) => {
  return fetchApi(`/api/issue-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(issueTypeData),
    token,
  });
};

// Delete an issue type
export const deleteIssueType = async (id: string, token: string) => {
  return fetchApi(`/api/issue-types/${id}`, {
    method: 'DELETE',
    token,
  });
};
