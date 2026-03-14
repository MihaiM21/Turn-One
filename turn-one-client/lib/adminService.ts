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

export const refreshNewsSessionData = async () => {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'No token found' };
    }

    try {
        const response = await fetch('/api/news/latest-session', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.error || 'Failed to refresh news data' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error refreshing news session data:', error);
        return { success: false, error: 'Failed to refresh news data' };
    }
};