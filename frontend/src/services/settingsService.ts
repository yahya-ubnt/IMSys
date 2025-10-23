import axios from 'axios';
import { fetchApi } from '@/lib/api/utils';

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
export const activateMpesa = async () => {
  // This function's implementation seems to be missing in the original code,
  // providing a placeholder.
  console.log("activateMpesa called");
  // Example:
  // const response = await fetchApi(`${API_URL}/mpesa/activate`, {
  //   method: 'POST',
  // });
  // return response;
  return Promise.resolve({ message: "M-Pesa activated" });
}


// SMS Provider Settings
export const getSmsProviders = async () => {
    return fetchApi('/api/settings/sms-providers');
};

export const createSmsProvider = async (providerData: any) => {
    return fetchApi('/api/settings/sms-providers', {
        method: 'POST',
        body: JSON.stringify(providerData),
    });
};

export const updateSmsProvider = async (id: string, providerData: any) => {
    return fetchApi(`/api/settings/sms-providers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(providerData),
    });
};

export const deleteSmsProvider = async (id: string) => {
    return fetchApi(`/api/settings/sms-providers/${id}`, {
        method: 'DELETE',
    });
};

export const setActiveSmsProvider = async (id: string) => {
    return fetchApi(`/api/settings/sms-providers/${id}/set-active`, {
        method: 'POST',
    });
};

// WhatsApp Provider Settings
export const getWhatsAppProviders = async () => {
    return fetchApi('/api/settings/whatsapp-providers');
};

export const createWhatsAppProvider = async (providerData: any) => {
    return fetchApi('/api/settings/whatsapp-providers', {
        method: 'POST',
        body: JSON.stringify(providerData),
    });
};

export const updateWhatsAppProvider = async (id: string, providerData: any) => {
    return fetchApi(`/api/settings/whatsapp-providers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(providerData),
    });
};

export const deleteWhatsAppProvider = async (id: string) => {
    return fetchApi(`/api/settings/whatsapp-providers/${id}`, {
        method: 'DELETE',
    });
};

export const setActiveWhatsAppProvider = async (id: string) => {
    return fetchApi(`/api/settings/whatsapp-providers/${id}/set-active`, {
        method: 'POST',
    });
};