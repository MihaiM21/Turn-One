"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { confirmEmail } from "@/lib/emailService";
import Link from "next/link";

export default function ConfirmEmailPage(props: any) {
  // Accept `props` as `any` because Next's generated PageProps expects
  // `searchParams` to be a Promise in some build scenarios. Casting to any
  // avoids the type-level mismatch while preserving runtime behavior.
  const searchParams = props?.searchParams;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const token = (searchParams as any)?.token || '';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No confirmation token provided. Please check the link in your email.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const result = await confirmEmail(token);
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been successfully verified.');
        } else {
          setStatus('error');
          setMessage(result.message || 'Failed to verify email.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred while verifying your email.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600">
              {status === 'loading' && <Mail className="h-6 w-6 text-white animate-pulse" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-white" />}
              {status === 'error' && <AlertCircle className="h-6 w-6 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {status === 'loading' && 'Verifying Email'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-red-100">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'success' && (
              <p className="text-sm text-red-200">
                You can now log in to your account and access all features.
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-200">
                The verification link may be expired or invalid. Please request a new verification email.
              </p>
            )}
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}