"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { PasswordInput } from "@/components/auth/password-input"
import { LiveTimingPreview } from "@/components/auth/live-timing-preview"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { login } from "@/lib/auth"
import type { LoginData } from "@/types/auth-types"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const loginData: LoginData = { email, password }
      const response = await login(loginData)

      if (response.success) {
        localStorage.setItem("token", response.token)
        router.push("/dashboard")
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      left={
        <div className="space-y-6">
          <span className="inline-block text-xs font-semibold tracking-[0.2em] text-primary">
            LIVE RIGHT NOW
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
            The race waits
            <br />
            for no one.
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Sign in and get back to the action — your custom layout, saved preferences, and live data streams are ready.
          </p>
          <LiveTimingPreview />
        </div>
      }
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your Turn One account</p>
        </div>

        <OAuthButtons />

        <form onSubmit={handleLogin} className="space-y-5">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>

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
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
            Create one free
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
