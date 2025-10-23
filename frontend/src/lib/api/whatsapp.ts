import { fetchApi } from './utils';
import { WhatsAppTemplate } from '@/types/whatsapp'; // Assuming a whatsapp type exists

// WhatsApp Template API functions
export const getWhatsAppTemplates = () => fetchApi('/api/whatsapp-templates');

export const createWhatsAppTemplate = (templateData: WhatsAppTemplate) => fetchApi('/api/whatsapp-templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
});

export const updateWhatsAppTemplate = (id: string, templateData: WhatsAppTemplate) => fetchApi(`/api/whatsapp-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(templateData),
});

export const deleteWhatsAppTemplate = (id: string) => fetchApi(`/api/whatsapp-templates/${id}`, {
    method: 'DELETE',
});

export const composeWhatsApp = (payload: any) => fetchApi('/api/whatsapp/compose', {
    method: 'POST',
    body: JSON.stringify(payload),
});