const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/whatsapp-templates`;

export const getWhatsAppTemplates = async (token: string) => {
    const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch WhatsApp templates');
    return response.json();
};

export const createWhatsAppTemplate = async (templateData: any, token: string) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create template');
    }
    return response.json();
};

export const updateWhatsAppTemplate = async (id: string, templateData: any, token: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update template');
    }
    return response.json();
};

export const deleteWhatsAppTemplate = async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete template');
    }
    return response.json();
};