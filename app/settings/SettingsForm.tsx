"use client"

import { useFormState, useFormStatus } from "react-dom"
import { completeOnboarding } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}

interface SettingsFormProps {
    initialFirstName: string
    initialLastName: string
    initialRegion: string
    initialSchool: string
    initialStartYear: number
}

export function SettingsForm({ 
    initialFirstName, 
    initialLastName,
    initialRegion,
    initialSchool,
    initialStartYear
}: SettingsFormProps) {
    const [state, formAction] = useFormState(completeOnboarding, undefined)
    const router = useRouter()
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        if (state === "success") {
            setShowSuccess(true)
            router.refresh()
            // Hide success message after 3 seconds
            const timer = setTimeout(() => setShowSuccess(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [state, router])

    return (
        <Card className="shadow-lg border-slate-200">
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                    Update your personal information and academic details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" defaultValue={initialFirstName} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" defaultValue={initialLastName} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school">School / University</Label>
                        <Input id="school" name="school" defaultValue={initialSchool} placeholder="e.g. City University of Hong Kong" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="region">Region</Label>
                            <Input id="region" name="region" defaultValue={initialRegion} placeholder="Hong Kong" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startYear">Starting Year</Label>
                            <Input id="startYear" name="startYear" type="number" min="1900" max="2100" defaultValue={initialStartYear} required />
                        </div>
                    </div>

                    <SubmitButton />
                    
                    {showSuccess && (
                        <div className="flex items-center justify-center gap-2 p-3 mt-4 text-sm text-green-700 bg-green-50 rounded-md animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Profile updated successfully!
                        </div>
                    )}
                    
                    {state && state !== "success" && (
                        <p className="text-center text-sm text-red-500 mt-2">{state}</p>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}

