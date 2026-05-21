import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { SettingsForm } from "./SettingsForm"

export default async function SettingsPage() {
    const session = await auth()
    
    if (!session?.user?.id) {
        redirect("/signin")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { university: true }
    })

    if (!user) {
        redirect("/signin")
    }

    // Split name if first/last name fields are empty (fallback)
    let firstName = user.firstName || ""
    let lastName = user.lastName || ""
    
    if (!firstName && user.name) {
        const parts = user.name.split(" ")
        if (parts.length > 1) {
            lastName = parts.pop() || ""
            firstName = parts.join(" ")
        } else {
            firstName = parts[0]
        }
    }

    const navbarUser = {
        name: user.name,
        email: user.email,
        image: user.image
    }

    return (
        <>
            <Navbar user={navbarUser} />
            <div className="min-h-screen bg-background py-12 px-4 md:px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                        <p className="text-muted-foreground mt-2">Manage your profile and account preferences.</p>
                    </div>

                    <SettingsForm 
                        initialFirstName={firstName}
                        initialLastName={lastName}
                        initialRegion={user.region || ""}
                        initialSchool={user.university?.name || ""}
                        initialStartYear={user.startYear || new Date().getFullYear()}
                    />
                </div>
            </div>
            <Footer />
        </>
    )
}

