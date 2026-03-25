import { SmsExpirySchedule, SmsTemplateData } from '@/types/sms';
import { fetchApi } from './utils';

// SMS Template API functions
export const getSmsTemplates = () => fetchApi('/api/smstemplates');

export const createSmsTemplate = (data: SmsTemplateData) => fetchApi('/api/smstemplates', {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateSmsTemplate = (id: string, data: SmsTemplateData) => fetchApi(`/api/smstemplates/${id}`, {
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

// General API functions (for Compose SMS dropdowns)
export const getSmsTriggers = async () => {
    const triggers = await fetchApi('/api/smstemplates/triggers');
    return triggers.map((trigger: any) => ({
        id: trigger.name, // Use name as id for consistency with Select component
        name: trigger.description || trigger.name, // Use description if available, otherwise name
        ...trigger // Spread the rest of the trigger object (including variables)
    }));
};
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

// Retry SMS function
export const retrySms = (id: string) => fetchApi(`/api/sms/logs/${id}/retry`, {
    method: 'POST',
});