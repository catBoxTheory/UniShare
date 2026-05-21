"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { validateVerificationCode } from "./verification";

export const registerUser = async (data: any) => {
  const { name, email, password, code } = data;

  if (!name || !email || !password || !code) {
    return { error: "Missing required fields" };
  }

  try {
    // 1. Validate verification code
    const verificationResult = await validateVerificationCode(email, code);
    if (verificationResult.error) {
      return { error: verificationResult.error };
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    // 5. Delete verification token after successful registration
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return { success: "Account created successfully!" };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to create account. Please try again." };
  }
};

