"use server"

import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email."),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(10, "Message must be at least 10 characters."),
})

export async function submitContactForm(
  prevState: string | undefined,
  formData: FormData
): Promise<string> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  })

  if (!validatedFields.success) {
    return "Please fill in all required fields correctly."
  }

  const { name, email, subject, message } = validatedFields.data

  console.log("[Contact Form]", { name, email, subject, message })

  await new Promise((resolve) => setTimeout(resolve, 1000))

  return "success"
}
