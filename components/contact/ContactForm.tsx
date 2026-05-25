"use client"

import { useFormState, useFormStatus } from "react-dom"
import { submitContactForm } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, Send } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Send Message
        </>
      )}
    </Button>
  )
}

export function ContactForm() {
  const [state, formAction] = useFormState(submitContactForm, undefined)

  return (
    <Card className="shadow-xl border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold text-card-foreground">
          Send us a message
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Fill out the form below and we&apos;ll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state === "success" ? (
          <div className="flex items-center justify-center gap-2 p-4 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Message sent successfully! We&apos;ll get back to you soon.
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-foreground">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="What is this about?"
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-foreground">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us how we can help..."
                rows={5}
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>

            {state && state !== "success" && (
              <p className="text-center text-sm text-destructive mt-2">{state}</p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}
