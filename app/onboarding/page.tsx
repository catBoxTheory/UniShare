import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { OnboardingForm } from "./OnboardingForm"
import prisma from "@/lib/prisma"
import { ThemeProvider } from "@/components/theme-provider"

export default async function OnboardingPage() {
    const session = await auth()
    
    if (!session?.user) {
        redirect("/signin")
    }

    // Check if already completed
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isOnboardingCompleted: true, name: true, image: true }
    })

    if (user?.isOnboardingCompleted) {
        redirect("/")
    }

    // Split name if possible
    let firstName = ""
    let lastName = ""
    if (user?.name) {
        const parts = user.name.split(" ")
        if (parts.length > 1) {
            lastName = parts.pop() || ""
            firstName = parts.join(" ")
        } else {
            firstName = parts[0]
        }
    }

    return (
        <ThemeProvider forcedTheme="light">
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900">Welcome!</h1>
                            <p className="text-slate-500 mt-2">Let's finish setting up your profile.</p>
                        </div>
                        
                        <OnboardingForm 
                            initialFirstName={firstName}
                            initialLastName={lastName}
                        />
                    </div>
                </div>
            </div>
        </ThemeProvider>
    )
}

