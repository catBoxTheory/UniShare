"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { generateVerificationToken, getVerificationTokenByEmail } from "@/lib/tokens"
import { sendVerificationEmail } from "@/lib/mail"

const emailSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

const codeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, {
    message: "Verification code must be 6 digits.",
  }),
})

export async function sendCode(email: string) {
  try {
    const validatedFields = emailSchema.safeParse({ email })

    if (!validatedFields.success) {
      return { error: "Invalid email address." }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "Email already in use." }
    }

    const verificationToken = await generateVerificationToken(email)
    
    // Always log to terminal in development for testing
    if (process.env.NODE_ENV === "development") {
        console.log("---------------------------------------------------")
        console.log(`[TESTING] Verification code for ${email}: ${verificationToken.token}`)
        console.log("---------------------------------------------------")
    }
    
    try {
        await sendVerificationEmail(verificationToken.identifier, verificationToken.token)
    } catch (emailError) {
        // If email fails but we are in dev mode, we can still proceed with devToken
        if (process.env.NODE_ENV !== "development") {
            throw emailError;
        }
        console.warn("Email sending failed in development, continuing with devToken fallback.");
    }

    return { success: "Verification code sent!" }
  } catch (error) {
    console.error("sendCode error:", error)
    return { error: "Failed to send verification code." }
  }
}

export async function validateCode(email: string, code: string) {
  try {
    const validatedFields = codeSchema.safeParse({ email, code })

    if (!validatedFields.success) {
      return { error: "Invalid code format." }
    }

    const existingToken = await getVerificationTokenByEmail(email)

    if (!existingToken) {
      return { error: "Code not found or expired." }
    }

    if (existingToken.token !== code) {
      return { error: "Invalid code." }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
      return { error: "Code has expired." }
    }
    
    // Valid code
    return { success: true }
  } catch (error) {
    console.error("validateCode error:", error)
    return { error: "Something went wrong." }
  }
}

