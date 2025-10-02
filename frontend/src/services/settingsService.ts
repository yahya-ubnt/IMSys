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

// Activate M-Pesa
export const activateMpesa = async (type: 'paybill' | 'till') => {
  const response = await axios.post(`${API_URL}/mpesa/activate`, { type });
  return response.data;
};
