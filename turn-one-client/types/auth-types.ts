export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    turnstileToken?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    username: string;
    expiration: string;
    emailConfirmed?: boolean;
    dailyGiftClaimed?: boolean;
}