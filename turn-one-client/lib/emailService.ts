// Use environment variable, or localhost for development, or the default production URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5271/api' : 'https://backend.t1f1.com/api');

/**
 * Request a password reset for the given email address
 * @param email - The email address to send the reset link to
 * @returns A promise that resolves to the response data
 */
export const requestPasswordReset = async (email: string) => {
  const response = await fetch(`${API_URL}/Auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to request password reset' }));
    throw new Error(errorData.message || 'Failed to request password reset');
  }
  
  return await response.json();
};

/**
 * Reset a password using a valid token
 * @param token - The password reset token received via email
 * @param password - The new password
 * @param confirmPassword - The confirmation of the new password
 * @returns A promise that resolves to the response data
 */
export const resetPassword = async (token: string, password: string, confirmPassword: string) => {
  const response = await fetch(`${API_URL}/Auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password, confirmPassword }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to reset password' }));
    throw new Error(errorData.message || 'Failed to reset password');
  }
  
  return await response.json();
};

/**
 * Confirm a user's email address using a token
 * @param token - The email confirmation token received via email
 * @returns A promise that resolves to the response data
 */
export const confirmEmail = async (token: string) => {
  const response = await fetch(`${API_URL}/Auth/confirm-email?token=${encodeURIComponent(token)}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to confirm email' }));
    throw new Error(errorData.message || 'Failed to confirm email');
  }
  
  return await response.json();
};
