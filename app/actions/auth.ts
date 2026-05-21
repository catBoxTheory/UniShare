"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { signIn, auth, signOut } from "@/auth"

// ...

export async function signOutAction() {
  await signOut()
}

import { AuthError } from "next-auth"
import prisma from "@/lib/prisma"
import { getVerificationTokenByEmail } from "@/lib/tokens"

const registerSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  firstName: z.string().min(1, {
    message: "First name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required.",
  }),
  region: z.string().optional(),
  school: z.string().min(1, {
    message: "School name is required.",
  }),
  startYear: z.coerce.number().min(1900).max(2100),
  code: z.string().length(6, {
    message: "Invalid verification code",
  }),
})

export async function register(prevState: string | undefined, formData: FormData) {
  // #region agent log
  // ... existing log logic ...
  // #endregion

  try {
    const validatedFields = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      region: formData.get("region"),
      school: formData.get("school"),
      startYear: formData.get("startYear"),
      code: formData.get("code"),
    })

    if (!validatedFields.success) {
      console.log(validatedFields.error)
      return "Invalid fields. Failed to register."
    }

    const { email, password, firstName, lastName, region, school, startYear, code } = validatedFields.data

    // 1. Verify Code
    const verificationToken = await getVerificationTokenByEmail(email)

    if (!verificationToken) {
      return "Verification code expired or invalid."
    }

    if (verificationToken.token !== code) {
      return "Invalid verification code."
    }

    if (new Date(verificationToken.expires) < new Date()) {
        return "Verification code expired."
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return "Email already in use."
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Handle University (Find or Create)
    let university = await prisma.university.findFirst({ // findFirst to handle casing if we wanted, but findUnique on name requires exact match
        where: { name: { equals: school, mode: 'insensitive' } }
    })

    if (!university) {
        university = await prisma.university.create({
            data: {
                name: school,
                slug: school.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            }
        })
    }

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        region,
        startYear,
        universityId: university.id,
        isOnboardingCompleted: true,
      },
    })
    
    // Delete the used token
    await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: code } }
    })

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

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" })
}

const onboardingSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    region: z.string().optional(),
    school: z.string().min(1, "School is required"),
    startYear: z.coerce.number().min(1900).max(2100),
})

export async function completeOnboarding(prevState: string | undefined, formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return "Unauthorized"

        const validatedFields = onboardingSchema.safeParse({
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            region: formData.get("region"),
            school: formData.get("school"),
            startYear: formData.get("startYear"),
        })

        if (!validatedFields.success) {
            return "Invalid fields"
        }

        const { firstName, lastName, region, school, startYear } = validatedFields.data

        // Handle University
        let university = await prisma.university.findFirst({
            where: { name: { equals: school, mode: 'insensitive' } }
        })

        if (!university) {
            university = await prisma.university.create({
                data: {
                    name: school,
                    slug: school.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                }
            })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                region,
                startYear,
                universityId: university.id,
                isOnboardingCompleted: true,
            }
        })

        return "success"
    } catch (error) {
        console.error(error)
        return "Something went wrong"
    }
}
