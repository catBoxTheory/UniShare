import crypto from "crypto"
import prisma from "@/lib/prisma"

export const generateVerificationToken = async (email: string) => {
  // Generate a random 6-digit number
  const token = crypto.randomInt(100000, 999999).toString()
  
  // Set expiration to 1 hour
  const expires = new Date(new Date().getTime() + 3600 * 1000)

  // Check if a token already exists for this email
  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  })

  // Delete existing token if it exists
  if (existingToken) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    })
  }

  // Create new token
  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return verificationToken
}

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    })

    return verificationToken
  } catch {
    return null
  }
}

