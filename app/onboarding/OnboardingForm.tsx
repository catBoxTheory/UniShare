"use client"

import { useFormState, useFormStatus } from "react-dom"
import { completeOnboarding } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6" disabled={pending}>
      {pending ? "Saving..." : "Complete Profile"}
    </Button>
  )
}

interface OnboardingFormProps {
    initialFirstName: string
    initialLastName: string
}

export function OnboardingForm({ initialFirstName, initialLastName }: OnboardingFormProps) {
    const [state, formAction] = useFormState(completeOnboarding, undefined)
    const router = useRouter()

    useEffect(() => {
        if (state === "success") {
            router.refresh() // Refresh to update session data on server if needed (though session cookie might need update or re-fetch)
            router.push("/")
        }
    }, [state, router])

    return (
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
                <Input id="school" name="school" placeholder="City University of Hong Kong" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" name="region" placeholder="Hong Kong" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="startYear">Starting Year</Label>
                    <Input id="startYear" name="startYear" type="number" min="1900" max="2100" placeholder="2024" required />
                </div>
            </div>

            <SubmitButton />
            {state && state !== "success" && (
                <p className="text-center text-sm text-red-500 mt-2">{state}</p>
            )}
        </form>
    )
}

