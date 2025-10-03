const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/smstemplates`;

export const getSmsTemplates = async (token: string) => {
    const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch SMS templates');
    return response.json();
};