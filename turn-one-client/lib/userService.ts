const API_URL = process.env.BACKEND_URL || 'https://backend.t1f1.com/api';

export const fetchWithAuth = async (endpoint: string, token: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// User Account API functions
export const fetchUserProfile = async (token: string) => {
  return fetchWithAuth('auth/me', token);
}

export const updateUserProfile = async (token: string, profileData: any) => {
  // Note: Update user profile endpoint doesn't exist in backend yet
  // This would need to be implemented in AuthController
  return fetchWithAuth('user/profile', token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
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


