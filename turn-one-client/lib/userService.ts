import { UserProfileUpdate } from "@/types/user-types";

// Use environment variable, or localhost for development, or the default production URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5271/api' : 'https://backend.t1f1.com/api');


export const fetchWithAuth = async (endpoint: string, token: string, options: RequestInit = {}) => {

  try {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      // Try to get a JSON error body, otherwise text
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        try {
          errorBody = await response.text();
        } catch {
          errorBody = null;
        }
      }
      const message = errorBody && errorBody.message ? errorBody.message : `${response.status} ${response.statusText}`;
      throw new Error(`API error: ${message}`);
    }

    // No Content
    if (response.status === 204) {
      return null;
    }

    // Try parse JSON, but guard in case of empty body
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      // Fallback to returning raw text
      return text;
    }
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// User Account API functions
export const fetchUserProfile = async (token: string) => {
  return fetchWithAuth('auth/me', token);
}
export const updateUserProfile = async (token: string, profileData: UserProfileUpdate) => {
  const result = await fetchWithAuth('user/update-profile', token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  // Backend returns 204 No Content on success — normalize to ApiResponse shape
  if (result === null) {
    return { success: true, data: profileData } as any;
  }

  // Otherwise assume backend returned an ApiResponse-like object
  return result;
}

export const fetchTokenStatus = async (token: string) => {
  return fetchWithAuth('subscription/token-status', token);
}

export const updateUserPreferences = async (token: string, preferences: any) => {
  // Note: User preferences endpoint doesn't exist in backend yet
  // This would need to be implemented
  return fetchWithAuth('user/preferences', token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });
}

export const changeUserPassword = async (token: string, passwordData: any) => {
  // Note: Change password endpoint doesn't exist in backend yet
  // This would need to be implemented in AuthController
  return fetchWithAuth('user/change-password', token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(passwordData),
  });
}

// Token Management API functions
export const consumeToken = async (token: string) => {
  return fetchWithAuth('subscription/consume-token', token, {
    method: 'POST',
  });
}

export const consumeTokens = async (token: string, amount: number) => {
  return fetchWithAuth('subscription/consume-tokens', token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(amount),
  });
}

export const purchaseTokens = async (token: string, amount: number, coinCost: number) => {
  return fetchWithAuth('Token/purchase', token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, coinCost }),
  });
}

export const claimStarterPack = async (token: string) => {
  return fetchWithAuth('Token/claim-starter-pack', token, {
    method: 'POST',
  });
}

export const getStarterPackStatus = async (token: string) => {
  return fetchWithAuth('Token/starter-pack-status', token);
}

// Plan Management API functions
export const upgradePlan = async (token: string, newPlan: string) => {
  return fetchWithAuth('subscription/upgrade', token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newPlan),
  });
}

export const downgradePlan = async (token: string, newPlan: string) => {
  return fetchWithAuth('subscription/downgrade', token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newPlan),
  });
}

