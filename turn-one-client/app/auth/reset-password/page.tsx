"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/emailService";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function ResetPasswordPage(props: any) {
  // Accept props as any because Next's generated PageProps may type searchParams as a Promise.
  const searchParams = props?.searchParams;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const token = (searchParams as any)?.token || '';

  useEffect(() => {
    if (!token) {
      setError("Reset token is missing. Please check your email link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      await resetPassword(token, password, confirmPassword);
      setIsReset(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully.",
        variant: "default",
      });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.");
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
              {isReset ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : error ? (
                <AlertCircle className="h-6 w-6 text-white" />
              ) : (
                <KeyRound className="h-6 w-6 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {isReset ? "Password Reset" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-red-100">
              {isReset
                ? "Your password has been reset successfully"
                : "Create a new secure password for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-950/40 border border-red-500/20 rounded-md p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            
            {isReset ? (
              <>
                <p className="text-sm text-center text-red-200">
                  You can now log in to your account using your new password.
                </p>
                <p className="text-sm text-center text-red-300">
                  Redirecting to login page...
                </p>
                <Button asChild className="w-full bg-red-600 hover:bg-red-700 mt-2">
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    disabled={!token || isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-red-800/30 text-white"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    disabled={!token || isSubmitting}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-black/50 border-red-800/30 text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                  disabled={!token || isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
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