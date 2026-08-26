const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api';


const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
};

export const checkAdminAccess = async () => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }

    try {
        const response = await fetch(`${API_URL}/admin/check`, {
            headers: {
                'Authorization': token,
            },
        });

        if (!response.ok) {
            return { success: false, error: 'Access denied' };
        }

        const data = await response.json();
        if (!data.isAdmin) {
            return { success: false, error: 'Not admin' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error checking admin access:', error);
        return { success: false, error: 'Failed to verify admin access' };
    }
};

export const fetchUsers = async () => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }

    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': token,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        } else {
            return { success: false, error: 'Failed to fetch users' };
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
};

export const updateUserPlan = async (userId: string, planTypeString: string) => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }
    try {
        let planType = null;
        if(planTypeString === 'BASIC') {
            planType = 0;
        }
        else if(planTypeString === 'PRO') {
            planType = 1;
        }
        else if(planTypeString === 'ELITE') {
            planType = 2;
        }
        const response = await fetch(`${API_URL}/admin/users/${userId}/plan`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ planType }),
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update user plan' };
        }
    } catch (error) {
        console.error('Error updating user plan:', error);
        return { success: false, error: 'Failed to update user plan' };
    }
};

export const updateUserRole = async (userId: string, role: number) => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ role }),
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update user role' };
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: 'Failed to update user role' };
    }
};

export const updateUserTokens = async (userId: string, tokens: number) => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }
    try{
        const response = await fetch(`${API_URL}/admin/users/${userId}/tokens`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: tokens.toString(),
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update user tokens' };
        }
    } catch (error) {
        console.error('Error updating user tokens:', error);
        return { success: false, error: 'Failed to update user tokens' };
    }
};
// Creator identity is the existing CONTENT_CREATOR role (set via updateUserRole
// below) — this only sets the optional monthly token override that applies
// while that role is assigned.
export const updateUserCreatorAllowance = async (userId: string, tokenAllowance: number | null) => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/creator-allowance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ tokenAllowance }),
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update creator token allowance' };
        }
    } catch (error) {
        console.error('Error updating creator token allowance:', error);
        return { success: false, error: 'Failed to update creator token allowance' };
    }
};

export const updateUserCoins = async (userId: string, coins: number) => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }
    try{
        const response = await fetch(`${API_URL}/admin/users/${userId}/coins`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: coins.toString(),
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update user tokens' };
        }
    } catch (error) {
        console.error('Error updating user tokens:', error);
        return { success: false, error: 'Failed to update user tokens' };
    }
};

export const deleteUser = async (userId: string) => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token,
            },
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Failed to delete user' };
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: 'Failed to delete user' };
    }
};

export const fetchOnlineUsers = async () => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found', count: 0, users: [] };
    }

    try {
        const response = await fetch(`${API_URL}/admin/online-users`, {
            headers: {
                'Authorization': token,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, count: data.count, users: data.users };
        } else {
            return { success: false, error: 'Failed to fetch online users', count: 0, users: [] };
        }
    } catch (error) {
        console.error('Error fetching online users:', error);
        return { success: false, error: 'Failed to fetch online users', count: 0, users: [] };
    }
};

// ── Telemetry Token-Usage / Request Log ─────────────────────────────────────

export interface TelemetryUsagePoint {
    periodStart: string;
    tokensUsed: number;
    requestCount: number;
}

export interface TelemetryRequest {
    id: string;
    userId: string;
    username: string;
    plotType: string;
    year: number;
    eventName: string;
    session: string;
    drivers?: string | null;
    durationMs: number;
    success: boolean;
    tokensUsed: number;
    errorMessage?: string | null;
    createdAt: string;
}

export interface TelemetryRequestPage {
    items: TelemetryRequest[];
    page: number;
    pageSize: number;
    totalCount: number;
}

export interface TelemetryUsageCount {
    label: string;
    count: number;
}

export interface TelemetryUsageSummary {
    totalTokensUsed: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageDurationMs: number;
    topPlotTypes: TelemetryUsageCount[];
    topUsers: TelemetryUsageCount[];
}

export interface TelemetryLogSettings {
    retentionDays: number;
    autoDeleteEnabled: boolean;
    updatedAt: string;
}

const buildQuery = (params: Record<string, string | number | undefined | null>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const s = q.toString();
    return s ? `?${s}` : '';
};

export const fetchTelemetryUsageSeries = async (
    params: { userId?: string; from?: string; to?: string; bucket?: string } = {},
): Promise<{ success: boolean; data?: TelemetryUsagePoint[]; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/series${buildQuery(params)}`, {
            headers: { 'Authorization': token },
        });
        if (!response.ok) return { success: false, error: 'Failed to fetch usage series' };
        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Error fetching usage series:', error);
        return { success: false, error: 'Failed to fetch usage series' };
    }
};

export const fetchTelemetryRequests = async (
    params: { userId?: string; from?: string; to?: string; page?: number; pageSize?: number; search?: string } = {},
): Promise<{ success: boolean; data?: TelemetryRequestPage; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/requests${buildQuery(params)}`, {
            headers: { 'Authorization': token },
        });
        if (!response.ok) return { success: false, error: 'Failed to fetch requests' };
        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Error fetching telemetry requests:', error);
        return { success: false, error: 'Failed to fetch requests' };
    }
};

export const fetchTelemetryUsageSummary = async (
    params: { userId?: string; from?: string; to?: string } = {},
): Promise<{ success: boolean; data?: TelemetryUsageSummary; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/summary${buildQuery(params)}`, {
            headers: { 'Authorization': token },
        });
        if (!response.ok) return { success: false, error: 'Failed to fetch summary' };
        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Error fetching usage summary:', error);
        return { success: false, error: 'Failed to fetch summary' };
    }
};

export const deleteTelemetryRequest = async (
    id: string,
): Promise<{ success: boolean; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/requests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token },
        });
        if (!response.ok) return { success: false, error: 'Failed to delete request' };
        return { success: true };
    } catch (error) {
        console.error('Error deleting telemetry request:', error);
        return { success: false, error: 'Failed to delete request' };
    }
};

export const bulkDeleteTelemetryRequests = async (
    params: { userId?: string; olderThan?: string } = {},
): Promise<{ success: boolean; count?: number; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/requests${buildQuery(params)}`, {
            method: 'DELETE',
            headers: { 'Authorization': token },
        });
        if (!response.ok) return { success: false, error: 'Failed to delete requests' };
        const data = await response.json();
        return { success: true, count: data.count };
    } catch (error) {
        console.error('Error bulk deleting telemetry requests:', error);
        return { success: false, error: 'Failed to delete requests' };
    }
};

export const fetchTelemetryLogSettings = async (): Promise<{ success: boolean; data?: TelemetryLogSettings; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/settings`, {
            headers: { 'Authorization': token },
        });
        if (!response.ok) return { success: false, error: 'Failed to fetch settings' };
        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Error fetching log settings:', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
};

export const updateTelemetryLogSettings = async (
    retentionDays: number,
    autoDeleteEnabled: boolean,
): Promise<{ success: boolean; data?: TelemetryLogSettings; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };
    try {
        const response = await fetch(`${API_URL}/admin/telemetry-usage/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ retentionDays, autoDeleteEnabled }),
        });
        if (!response.ok) return { success: false, error: 'Failed to update settings' };
        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('Error updating log settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
};

// ── Page Maintenance ───────────────────────────────────────────────────────

export interface PageStatusData {
    pageSlug: string;
    isDisabled: boolean;
    maintenanceMessage?: string;
}

/** Public — no token required. Used by client pages to check their own status. */
export const getPageStatus = async (slug: string): Promise<PageStatusData | null> => {
    try {
        const response = await fetch(`${API_URL}/pages/${slug}`);
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.error('Error fetching page status:', error);
        return null;
    }
};

/** Admin-only — fetches all managed page statuses. */
export const getAllPageStatuses = async (): Promise<PageStatusData[]> => {
    const token = getToken();
    if (!token) {
        console.warn('[PageStatus] No token, skipping fetch');
        return [];
    }

    try {
        const url = `${API_URL}/admin/page-status`;
        console.log('[PageStatus] Fetching', url);
        const response = await fetch(url, {
            headers: { 'Authorization': token },
        });
        console.log('[PageStatus] Response status:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('[PageStatus] Error response:', text);
            return [];
        }
        const data = await response.json();
        console.log('[PageStatus] Data:', data);
        return data;
    } catch (error) {
        console.error('[PageStatus] Fetch failed:', error);
        return [];
    }
};


/** Admin-only — enables or disables a page with an optional maintenance message. */
export const setPageStatus = async (
    slug: string,
    isDisabled: boolean,
    maintenanceMessage: string,
): Promise<{ success: boolean; data?: PageStatusData; error?: string }> => {
    const token = getToken();
    if (!token) return { success: false, error: 'No token found' };

    try {
        const response = await fetch(`${API_URL}/admin/page-status/${slug}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ isDisabled, maintenanceMessage }),
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        } else {
            return { success: false, error: 'Failed to update page status' };
        }
    } catch (error) {
        console.error('Error setting page status:', error);
        return { success: false, error: 'Failed to update page status' };
    }
};