"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export const updateUserInfo = async (data: { name: string; image?: string }) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        image: data.image,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: "Profile updated successfully!" };
  } catch (error) {
    return { error: "Failed to update profile." };
  }
};

