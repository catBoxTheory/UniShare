"use server"

import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

const prisma = new PrismaClient()

const registerSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

export async function register(prevState: string | undefined, formData: FormData) {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'app/actions/auth.ts:register',
        message: 'Register action called',
        data: { email: formData.get("email") as string },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'auth-registration'
      })
    }).catch(() => {});
  } catch (e) {}
  // #endregion

  try {
    const validatedFields = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    })

    if (!validatedFields.success) {
      return "Invalid fields. Failed to register."
    }

    const { email, password, name } = validatedFields.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return "Email already in use."
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Auto sign in after registration (optional, or just redirect to login)
    // await signIn("credentials", { email, password, redirect: false })
    
    return "User registered successfully."
  } catch (error) {
    console.error(error)
    return "Something went wrong."
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials."
        default:
          return "Something went wrong."
      }
    }
    throw error
  }
}

