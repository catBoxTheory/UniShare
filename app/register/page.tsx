"use client"

import { useFormState, useFormStatus } from "react-dom"
import { register, googleSignIn } from "@/app/actions/auth"
import { sendCode } from "@/app/actions/verification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Loader2, Mail, CheckCircle2, ShieldCheck, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const HONG_KONG_UNIVERSITIES = [
  "The University of Hong Kong",
  "The Chinese University of Hong Kong",
  "The Hong Kong University of Science and Technology",
  "City University of Hong Kong",
  "The Hong Kong Polytechnic University",
  "Hong Kong Baptist University",
  "Lingnan University",
  "The Education University of Hong Kong",
  "Hong Kong Metropolitan University",
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

function GoogleButton() {
  return (
    <form action={googleSignIn}>
      <Button variant="outline" className="w-full flex items-center justify-center gap-2" type="submit">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>
    </form>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(register, undefined)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [school, setSchool] = useState("")

  const handleSendCode = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address first.")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
        const result = await sendCode(email)
        if (result.error) {
            setError(result.error)
        } else {
            setError("Verification code sent! Please check your inbox.")
        }
    } catch (err) {
        setError("Failed to send code. Please try again.")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar hideAuthButton />
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg shadow-xl border-border my-8 bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold text-card-foreground">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your details and verify your email to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "User registered successfully." ? (
             <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                    Account created successfully!
                </div>
                <Button asChild className="w-full">
                    <Link href="/signin">Sign in now</Link>
                </Button>
             </div>
          ) : (
            <>
            <GoogleButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
              </div>
            </div>

            <form action={formAction} className="space-y-4">
                {/* Email & Verification Section */}
                <div className="space-y-4 p-5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="font-semibold ml-1">Email Address</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background border-border text-foreground"
                                    required
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleSendCode}
                                disabled={isLoading || !email}
                                variant="secondary"
                                className="shadow-sm whitespace-nowrap px-6"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code" className="font-semibold ml-1">Verification Code</Label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <Input
                                id="code"
                                name="code"
                                placeholder="Enter 6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                className="pl-10 bg-background border-border text-foreground font-mono font-bold tracking-[0.3em] text-center"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Profile Details Section */}
                <div className="space-y-5 pt-4 px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="font-medium text-foreground">First Name</Label>
                            <Input id="firstName" name="firstName" placeholder="John" className="bg-background border-border text-foreground" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="font-medium text-foreground">Last Name</Label>
                            <Input id="lastName" name="lastName" placeholder="Tsang" className="bg-background border-border text-foreground" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-foreground">Password</Label>
                        <Input id="password" name="password" type="password" placeholder="••••••••" className="bg-background border-border text-foreground" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school" className="text-foreground">School / University</Label>
                        <Select name="school" value={school} onValueChange={setSchool}>
                            <SelectTrigger id="school" className="bg-background border-border text-foreground">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                                    <SelectValue placeholder="Select your university" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {HONG_KONG_UNIVERSITIES.map((uni) => (
                                    <SelectItem key={uni} value={uni}>
                                        {uni}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="region" className="text-foreground">Region</Label>
                            <Input id="region" name="region" placeholder="Hong Kong" className="bg-background border-border text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startYear" className="text-foreground">Starting Year</Label>
                            <Input id="startYear" name="startYear" type="number" min="1900" max="2100" placeholder="2025" className="bg-background border-border text-foreground" required />
                        </div>
                    </div>

                    <div className="pt-2">
                        <SubmitButton />
                    </div>
                </div>

                {error && (
                    <div className={cn(
                        "text-center text-sm p-3 rounded-lg border flex items-center justify-center gap-2",
                        (error.includes("sent") || error.includes("Dev Mode"))
                            ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                            : "text-red-500 bg-red-50 border-red-100"
                    )}>
                        {(error.includes("sent") || error.includes("Dev Mode")) && <CheckCircle2 className="w-4 h-4" />}
                        {error}
                    </div>
                )}

                {state && state !== "User registered successfully." && (
                    <div className="text-center text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-center gap-2">
                        {state}
                    </div>
                )}
            </form>
            </>
          )}

          {state !== "User registered successfully." && (
            <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-4">
                Already have an account?{" "}
                <Link href="/signin" className="text-primary hover:underline font-medium">
                Sign in
                </Link>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  )
}
