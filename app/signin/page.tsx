import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignInForm } from "./SignInForm"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default async function SignInPage() {
  const session = await auth()

  // Redirect to home if already authenticated
  if (session?.user) {
    redirect("/")
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <SignInForm />
      </div>
      <Footer />
    </>
  )
}
