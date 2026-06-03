"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { PasswordInput } from "@/components/auth/password-input"
import { FeatureList } from "@/components/auth/feature-list"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { register } from "@/lib/auth"
import { RegisterData } from "@/types/auth-types"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const registerData: RegisterData = { email, username, password, confirmPassword }
      const response = await register(registerData)

      if (response.success) {
        if (response.emailConfirmed) {
          localStorage.setItem("token", response.token)
          router.push("/dashboard")
        } else {
          router.push("/auth/check-email")
        }
      } else {
        throw new Error(response.message || "Registration failed")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      left={
        <div className="space-y-6">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] text-primary">
            FREE FOREVER
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
            Your free account
            <br />
            includes everything.
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            No credit card. No trial period. Just sign up and you&apos;re in the race.
          </p>
          <FeatureList />
        </div>
      }
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
          <p className="text-sm text-muted-foreground">Join Turn One — it&apos;s completely free</p>
        </div>

        <OAuthButtons />

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Max Verstappen"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="font-semibold text-foreground hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-foreground hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 text-sm font-semibold"
          >
            {isLoading ? "Creating account..." : "Create free account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>

        <div className="pt-4 border-t border-border">
          <Button variant="outline" asChild className="w-full h-11">
            <Link href="/">Continue as guest — no account needed</Link>
          </Button>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
