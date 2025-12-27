"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteFileFromMinio } from "@/lib/storage";
import { FolderType } from "@prisma/client";
import { auth } from "@/auth";

export async function createCourse(title: string, code: string, universityName: string = "City University") {
  try {
    const session = await auth();
    // Optional: enforce login
    // if (!session?.user) return { success: false, error: "Unauthorized" };

    // Ensure University exists (simple mock logic: find or create)
    let university = await prisma.university.findUnique({
       where: { name: universityName }
    });
    
    if (!university) {
       university = await prisma.university.create({
          data: { 
             name: universityName,
             slug: universityName.toLowerCase().replace(/\s+/g, '-'),
          }
       });
    }

    // Ensure Default Department exists
    let department = await prisma.department.findFirst({
        where: { universityId: university.id }
    });

    if (!department) {
        department = await prisma.department.create({
            data: {
                name: "General Department",
                slug: "general",
                universityId: university.id
            }
        })
    }

    const course = await prisma.course.create({
      data: {
        title,
        code,
        departmentId: department.id,
      },
    });
    
    revalidatePath(`/`);
    return { success: true, data: course };
  } catch (error) {
    console.error("Failed to create course:", error);
    return { success: false, error: "Failed to create course" };
  }
}

export async function getCourses(query?: string) {
    try {
        const where: any = {};
        
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } }
            ];
        }

        return await prisma.course.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { department: true }
        });
    } catch (error) {
        console.error("Failed to get courses:", error);
        return [];
    }
}

export async function getCourseById(courseId: string) {
    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { department: true }
        });
        return course; // Return null if not found, let the page handle it
    } catch (error) {
        console.error("Failed to get course:", error);
        return null;
    }
}

export async function updateCourse(courseId: string, title: string, code: string) {
  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { title, code },
    });

    revalidatePath(`/`);
    revalidatePath(`/courses/${courseId}`);
    return { success: true, data: course };
  } catch (error) {
    console.error("Failed to update course:", error);
    return { success: false, error: "Failed to update course" };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    // First, find all materials associated with the course
    const materials = await prisma.material.findMany({
      where: { courseId: courseId },
      select: { url: true },
    });

    // Delete each file from MinIO
    for (const material of materials) {
      if (material.url) {
        await deleteFileFromMinio(material.url);
      }
    }

    // Delete the course (Prisma's cascade delete will handle associated folders and materials in DB)
    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath(`/`); // Revalidate home page
    return { success: true };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return { success: false, error: "Failed to delete course" };
  }
}

// User-specific actions

export async function getRecentCourses() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const recents = await prisma.recentView.findMany({
            where: { userId: session.user.id },
            orderBy: { viewedAt: 'desc' },
            take: 6,
            include: {
                course: {
                    include: { 
                        department: true,
                        enrollments: {
                            where: { userId: session.user.id }
                        }
                    }
                }
            }
        });

        return recents.map(r => ({
            ...r.course,
            isEnrolled: r.course.enrollments.length > 0
        }));
    } catch (error) {
        console.error("Failed to get recent courses:", error);
        return [];
    }
}

export async function getEnrolledCourses() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const enrollments = await prisma.enrollment.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                course: {
                    include: { department: true }
                }
            }
        });

        return enrollments.map(e => e.course);
    } catch (error) {
        console.error("Failed to get enrolled courses:", error);
        return [];
    }
}

export async function isEnrolled(courseId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return false;

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId
                }
            }
        });

        return !!enrollment;
    } catch (error) {
        return false;
    }
}

export async function toggleEnrollment(courseId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId
                }
            }
        });

        if (existing) {
            await prisma.enrollment.delete({
                where: { id: existing.id }
            });
            revalidatePath('/');
            return { success: true, enrolled: false };
        } else {
            await prisma.enrollment.create({
                data: {
                    userId: session.user.id,
                    courseId
                }
            });
            revalidatePath('/');
            return { success: true, enrolled: true };
        }
    } catch (error) {
        console.error("Toggle enrollment error:", error);
        return { success: false, error: "Failed to update library" };
    }
}

export async function logView(courseId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return;

        await prisma.recentView.upsert({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId
                }
            },
            create: {
                userId: session.user.id,
                courseId,
                viewedAt: new Date()
            },
            update: {
                viewedAt: new Date()
            }
        });
        
        revalidatePath('/');
    } catch (error) {
        console.error("Failed to log view:", error);
    }
}
