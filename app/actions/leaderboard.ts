"use server";

import prisma from "@/lib/prisma";

export async function getLeaderboard(courseId?: string) {
  try {
    const whereCourse = courseId ? { courseId } : {};

    const uploaders = await prisma.material.groupBy({
      by: ["courseId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
      ...(courseId ? { where: { courseId } } : {}),
    });

    if (uploaders.length === 0) return [];

    // For each top course, get the course info
    // Actually, let's find top contributors by user
    // We need to join through user's materials... but Material doesn't have a direct user relation.
    // Instead, let's rank by material count per course and show course contributors.
    // Since materials don't track uploader, we show top courses by material count.

    const courseIds = uploaders.map((u) => u.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        department: { select: { name: true } },
        _count: { select: { materials: true, enrollments: true } },
      },
    });

    const courseMap = new Map(courses.map((c) => [c.id, c]));
    return uploaders
      .map((u, i) => {
        const course = courseMap.get(u.courseId);
        if (!course) return null;
        return {
          rank: i + 1,
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
          departmentName: course.department?.name || "",
          materialCount: course._count.materials,
          enrollmentCount: course._count.enrollments,
        };
      })
      .filter(Boolean) as {
      rank: number;
      courseId: string;
      courseTitle: string;
      courseCode: string;
      departmentName: string;
      materialCount: number;
      enrollmentCount: number;
    }[];
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return [];
  }
}
