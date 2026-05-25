"use client"

import { useFormState, useFormStatus } from "react-dom"
import { completeOnboarding } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { GraduationCap } from "lucide-react"
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
    <Button type="submit" className="w-full mt-6" disabled={pending}>
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
    const [school, setSchool] = useState("")

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
                    <Label htmlFor="firstName" className="font-medium text-foreground">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={initialFirstName} required className="bg-background border-border text-foreground" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-medium text-foreground">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={initialLastName} required className="bg-background border-border text-foreground" />
                </div>
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
                    <Input id="startYear" name="startYear" type="number" min="1900" max="2100" placeholder="2025" required className="bg-background border-border text-foreground" />
                </div>
            </div>

            <SubmitButton />
            {state && state !== "success" && (
                <p className="text-center text-sm text-red-500 mt-2">{state}</p>
            )}
        </form>
    )
}

