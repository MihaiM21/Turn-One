import { fetchWithAuth } from './data-fetcher';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';

export interface PageStatus {
    id: number;
    pageName: string;
    isClosed: boolean;
    maintenanceMessage: string;
}

export const getPageStatus = async (pageName: string): Promise<PageStatus> => {
    try {
        const encodedPageName = encodeURIComponent(pageName);
        const response = await fetch(`${API_BASE_URL}/PageStatus/${encodedPageName}`);
        if (!response.ok) {
            throw new Error('Failed to fetch page status');
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching status for page ${pageName}:`, error);
        // Default to open if we can't fetch the status
        return {
            id: 0,
            pageName,
            isClosed: false,
            maintenanceMessage: ''
        };
    }
};

export const getAllPageStatuses = async (): Promise<PageStatus[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/PageStatus`);
        if (!response.ok) {
            throw new Error('Failed to fetch all page statuses');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching all page statuses:', error);
        return [];
    }
};

export const updatePageStatus = async (pageName: string, isClosed: boolean, maintenanceMessage: string): Promise<PageStatus> => {
    try {
        const encodedPageName = encodeURIComponent(pageName);
        const response = await fetchWithAuth<PageStatus>(`/PageStatus/${encodedPageName}`, {
            method: 'PUT',
            body: JSON.stringify({ isClosed, maintenanceMessage })
        });
        return response;
    } catch (error) {
        console.error(`Error updating status for page ${pageName}:`, error);
        throw error;
    }
};
