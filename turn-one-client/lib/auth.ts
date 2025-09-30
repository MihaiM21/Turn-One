import { useState, useEffect } from 'react';

const API_URL = process.env.BACKEND_URL || 'http://localhost:5271/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  username: string;
  expiration: string;
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/Auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(errorData.message || 'Login failed');
  }

  return await response.json();
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/Auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(errorData.message || 'Registration failed');
  }

  return await response.json();
};

export const getCurrentUser = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/Auth/me`, {
    headers: {
      'Authorization': token,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user data');
  }

  return await response.json();
};

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = async (data: LoginData) => {
    const response = await login(data);
    localStorage.setItem('token', response.token);
    
    const userData = await getCurrentUser();
    setUser(userData);
    return response;
  };

  const registerUser = async (data: RegisterData) => {
    const response = await register(data);
    localStorage.setItem('token', response.token);
    
    const userData = await getCurrentUser();
    setUser(userData);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return {
    user,
    loading,
    loginUser,
    registerUser,
    logout,
    isAuthenticated: !!user,
  };
};
