import axios from 'axios';

const API_URL = '/api/settings';

// Get M-Pesa settings
export const getMpesaSettings = async () => {
  const response = await axios.get(`${API_URL}/mpesa`);
  return response.data;
};

// Update M-Pesa settings
export const updateMpesaSettings = async (type: 'paybill' | 'till', data: any) => {
  const response = await axios.put(`${API_URL}/mpesa`, { type, data });
  return response.data;
};

// Note: Assuming there might be an activate function, keeping it distinct.
// If not, this can be removed.
export const activateMpesa = async (token: string) => {
  // This function's implementation seems to be missing in the original code,
  // providing a placeholder.
  console.log("activateMpesa called with token:", token);
  // Example:
  // const response = await fetch(`${API_URL}/mpesa/activate`, {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${token}` },
  // });
  // if (!response.ok) throw new Error('Failed to activate M-Pesa');
  // return response.json();
  return Promise.resolve({ message: "M-Pesa activated" });
}


// SMS Provider Settings
const SMS_PROVIDERS_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/settings/sms-providers`;

export const getSmsProviders = async (token: string) => {
    const response = await fetch(SMS_PROVIDERS_API_URL, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch SMS providers');
    return response.json();
};

export const createSmsProvider = async (providerData: any, token: string) => {
    const response = await fetch(SMS_PROVIDERS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(providerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create SMS provider');
    }
    return response.json();
};

export const updateSmsProvider = async (id: string, providerData: any, token: string) => {
    const response = await fetch(`${SMS_PROVIDERS_API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(providerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update SMS provider');
    }
    return response.json();
};

export const deleteSmsProvider = async (id: string, token: string) => {
    const response = await fetch(`${SMS_PROVIDERS_API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete SMS provider');
    }
    return response.json();
};

export const setActiveSmsProvider = async (id: string, token: string) => {
    const response = await fetch(`${SMS_PROVIDERS_API_URL}/${id}/set-active`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set active SMS provider');
    }
    return response.json();
};