"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/emailService";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setIsEmailSent(true);
      toast({
        title: "Password reset link sent",
        description: "Please check your email for instructions to reset your password.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600">
              {isEmailSent ? (
                <Mail className="h-6 w-6 text-white" />
              ) : (
                <KeyRound className="h-6 w-6 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {isEmailSent ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-red-100">
              {isEmailSent
                ? "We've sent you a password reset link"
                : "Enter your email and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEmailSent ? (
              <>
                <p className="text-sm text-center text-red-200">
                  Please check your inbox for instructions to reset your password. The link will expire in 1 hour.
                </p>
                <Button asChild className="w-full bg-red-600 hover:bg-red-700">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/50 border-red-800/30 text-white placeholder:text-red-200/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center mt-4">
                  <Link
                    href="/auth/login"
                    className="text-red-300 hover:text-red-200 transition-colors text-sm"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}