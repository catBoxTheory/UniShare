"use client"

import { useFormState, useFormStatus } from "react-dom"
import { register } from "@/app/actions/auth"
import { sendCode } from "@/app/actions/verification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Loader2, Mail, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={pending}>
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

export default function RegisterPage() {
  const [state, formAction] = useFormState(register, undefined)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

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
    <ThemeProvider forcedTheme="light">
      <Navbar variant="solid" />
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-lg shadow-xl border-slate-200 my-8 bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold text-slate-900">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Enter your details and verify your email to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state === "User registered successfully." ? (
             <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                    Account created successfully!
                </div>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/signin">Sign in now</Link>
                </Button>
             </div>
          ) : (
            <form action={formAction} className="space-y-4">
                {/* Email & Verification Section */}
                <div className="space-y-4 p-5 bg-blue-50/40 rounded-2xl border border-blue-100/50 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-blue-900 font-semibold ml-1">Email Address</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <Input 
                                    id="email" 
                                    name="email"
                                    type="email" 
                                    placeholder="john@example.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-white border-blue-100 focus-visible:ring-blue-500"
                                    required 
                                />
                            </div>
                            <Button 
                                type="button" 
                                onClick={handleSendCode} 
                                disabled={isLoading || !email}
                                variant="secondary"
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap px-6"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-blue-900 font-semibold ml-1">Verification Code</Label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                            <Input 
                                id="code" 
                                name="code"
                                placeholder="Enter 6-digit code" 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                className="pl-10 bg-white border-blue-100 focus-visible:ring-blue-500 font-mono font-bold tracking-[0.3em] text-center"
                                required 
                            />
                        </div>
                    </div>
                </div>

                {/* Profile Details Section */}
                <div className="space-y-5 pt-4 px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="font-medium text-slate-700">First Name</Label>
                            <Input id="firstName" name="firstName" placeholder="John" className="bg-white border-slate-200 text-slate-900" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="font-medium text-slate-700">Last Name</Label>
                            <Input id="lastName" name="lastName" placeholder="Tsang" className="bg-white border-slate-200 text-slate-900" required />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-700">Password</Label>
                        <Input id="password" name="password" type="password" placeholder="••••••••" className="bg-white border-slate-200 text-slate-900" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school" className="text-slate-700">School / University</Label>
                        <Input id="school" name="school" placeholder="City University of Hong Kong" className="bg-white border-slate-200 text-slate-900" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="region" className="text-slate-700">Region</Label>
                            <Input id="region" name="region" placeholder="Hong Kong" className="bg-white border-slate-200 text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startYear" className="text-slate-700">Starting Year</Label>
                            <Input id="startYear" name="startYear" type="number" min="1900" max="2100" placeholder="2025" className="bg-white border-slate-200 text-slate-900" required />
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
                            ? "text-blue-700 bg-blue-50 border-blue-100" 
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
          )}
          
          {state !== "User registered successfully." && (
            <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-200 pt-4">
                Already have an account?{" "}
                <Link href="/signin" className="text-blue-600 hover:underline font-medium">
                Sign in
                </Link>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      <Footer variant="solid" />
    </ThemeProvider>
  )
}
