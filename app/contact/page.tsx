import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { ContactForm } from "@/components/contact/ContactForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us - UniShare",
  description: "Get in touch with the UniShare team. We'd love to hear from you.",
}

export default function ContactPage() {
  return (
    <>
      <Navbar variant="default" />
      <main className="flex flex-col min-h-screen bg-background">
        <section className="py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <p className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-300 uppercase mb-4">
              Get in touch
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mt-4 max-w-prose">
              Have questions, feedback, or need help? We&apos;d love to hear from
              you.
            </p>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-y border-border">
          <div className="container px-4 md:px-6 mx-auto max-w-2xl">
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer variant="default" />
    </>
  )
}
