import { SmsTemplate, SmsExpirySchedule, SmsAcknowledgement } from '@/types/sms';
// In a real app, you would have a more robust way to get the token
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user).token : null;
    }
    return null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Generic fetch wrapper
async function fetchApi(path: string, options: RequestInit = {}) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
    }

    return response.json();
}

// SMS Template API functions
export const getSmsTemplates = () => fetchApi('/api/smstemplates');

export const createSmsTemplate = (data: SmsTemplate) => fetchApi('/api/smstemplates', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateSmsTemplate = (id: string, data: SmsTemplate) => fetchApi(`/api/smstemplates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteSmsTemplate = (id: string) => fetchApi(`/api/smstemplates/${id}`, {
    method: 'DELETE',
});

// SMS Expiry Schedule API functions
export const getSmsExpirySchedules = () => fetchApi('/api/smsexpiryschedules');

export const createSmsExpirySchedule = (data: SmsExpirySchedule) => fetchApi('/api/smsexpiryschedules', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateSmsExpirySchedule = (id: string, data: SmsExpirySchedule) => fetchApi(`/api/smsexpiryschedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteSmsExpirySchedule = (id: string) => fetchApi(`/api/smsexpiryschedules/${id}`, {
    method: 'DELETE',
});

// SMS Acknowledgement API functions
export const getSmsAcknowledgements = () => fetchApi('/api/smsacknowledgements');

export const createSmsAcknowledgement = (data: SmsAcknowledgement) => fetchApi('/api/smsacknowledgements', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateSmsAcknowledgement = (id: string, data: SmsAcknowledgement) => fetchApi(`/api/smsacknowledgements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteSmsAcknowledgement = (id: string) => fetchApi(`/api/smsacknowledgements/${id}`, {
    method: 'DELETE',
});

// General API functions (for Compose SMS dropdowns)
export const getMikrotikClientsForSms = () => fetchApi('/api/mikrotik/users/clients-for-sms');
export const getMikrotikRouters = () => fetchApi('/api/mikrotik/routers');
export const getBuildings = () => fetchApi('/api/buildings');

// Compose SMS function
export const composeAndSendSms = (data: { mobileNumber: string; message: string; messageType: string; userId?: string; mikrotikId?: string; buildingId?: string; }) => fetchApi('/api/sms/compose', {
    method: 'POST',
    body: JSON.stringify(data),
});

// Sent SMS Log function
export const getSentSmsLog = (params: string) => fetchApi(`/api/sms/log?${params}`);