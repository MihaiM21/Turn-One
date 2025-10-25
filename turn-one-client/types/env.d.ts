// This file contains environment variable declarations for TypeScript
// Add any environment variables you need to use in your code here

declare namespace NodeJS {
  interface ProcessEnv {
    // Add environment variables here
    NEXT_PUBLIC_BACKEND_URL?: string;
    NEXT_PUBLIC_API_URL?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}