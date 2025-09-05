"use client"

import type React from "react"

//import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

//   const handleSignUp = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const supabase = createClient()
//     setIsLoading(true)
//     setError(null)

//     try {
//       const { error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
//           data: {
//             first_name: firstName,
//             last_name: lastName,
//           },
//         },
//       })
//       if (error) throw error
//       router.push("/auth/check-email")
//     } catch (error: unknown) {
//       setError(error instanceof Error ? error.message : "An error occurred")
//     } finally {
//       setIsLoading(false)
//     }
//   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" asChild className="text-red-200 hover:bg-red-950/20">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">Join Turn One</CardTitle>
            <CardDescription className="text-red-100">Create your F1 telemetry account</CardDescription>
          </CardHeader>
          <CardContent>
            <form  className="space-y-4"> {/* onSubmit={handleSignUp} */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-black/50 border-red-800/30 text-white placeholder:text-red-200/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-black/50 border-red-800/30 text-white placeholder:text-red-200/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
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
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/50 border-red-800/30 text-white"
                />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-950/20 p-2 rounded">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-red-100">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-red-400 hover:text-red-300 underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
