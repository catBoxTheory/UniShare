import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCourseById, logView, isEnrolled } from "@/app/actions/courses";
import { CourseDashboardTabs } from "@/components/course/CourseDashboardTabs";
import { DeleteCourseButton } from "@/components/course/DeleteCourseButton";
import { EditableCourseHeader } from "@/components/course/EditableCourseHeader";
import { LibraryToggleButton } from "@/components/course/LibraryToggleButton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import prisma from "@/lib/prisma";
import { MaterialType } from "@prisma/client";
import { auth } from "@/auth";

interface CoursePageProps {
  params: {
    courseId: string;
  };
  searchParams: {
    tab?: string;
  };
}

const CoursePage = async ({ params, searchParams }: CoursePageProps) => {
  // Check auth for library button
  const session = await auth();
  
  // Fetch course info
  const course = await getCourseById(params.courseId);
  
  if (!course) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-red-600">Course Not Found</h1>
          <p className="mt-2 text-muted-foreground">This course ID does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  // Log view if user is logged in
  if (session?.user) {
    await logView(params.courseId);
  }

  // Check if enrolled
  const enrolled = session?.user ? await isEnrolled(params.courseId) : false;

  // Fetch initial documents (non-video materials)
  const documents = await prisma.material.findMany({
    where: {
      courseId: params.courseId,
      type: { not: MaterialType.VIDEO }
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      url: true,
      createdAt: true
    }
  });

  // Fetch initial videos
  const videos = await prisma.material.findMany({
    where: {
      courseId: params.courseId,
      type: MaterialType.VIDEO
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      url: true,
      createdAt: true
    }
  });

  const defaultTab = searchParams.tab === "videos" ? "videos" : "documents";

  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image
  } : null;

  return (
    <>
      <Navbar user={user} />
      <div className="container mx-auto p-4 max-w-7xl flex-1">
        {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground">{course.code}</span>
          </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <EditableCourseHeader
          courseId={course.id}
          initialCode={course.code}
          initialTitle={course.title}
          description={course.description}
        />
        <div className="flex items-center gap-2">
          {session?.user && (
            <LibraryToggleButton courseId={course.id} initialEnrolled={enrolled} />
          )}
          <DeleteCourseButton
            courseId={course.id}
            courseName={`${course.code} - ${course.title}`}
            variant="text"
          />
        </div>
      </div>

      {/* Tabbed Content */}
      <CourseDashboardTabs
        courseId={params.courseId}
        initialDocuments={documents}
        initialVideos={videos}
        defaultTab={defaultTab}
      />
      </div>
      <Footer />
    </>
  );
};

export default CoursePage;
