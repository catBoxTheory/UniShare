import Link from "next/link";
import { Search, BookOpen, GraduationCap, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/app/actions/courses";
import { CreateCourseButton } from "@/components/course/CreateCourseButton";
import { CourseCard } from "@/components/course/CourseCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  
  // Fetch real courses from the database filtering by query
  const courses = await getCourses(searchParams?.q);

  // Fetch enrolled course IDs if user is logged in
  let enrolledCourseIds: string[] = [];
  if (session?.user?.id) {
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: session.user.id },
        select: { courseId: true }
    });
    enrolledCourseIds = enrollments.map(e => e.courseId);
  }

  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image
  } : null;

  return (
    <>
      <Navbar user={user} />
      <div className="flex flex-col min-h-screen bg-slate-50">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 py-8">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
              &larr; Back to Dashboard
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                  Search Results
                </h1>
                <p className="text-muted-foreground">
                  Showing results for &quot;{searchParams?.q || "all courses"}&quot;
                </p>
              </div>
              
              <div className="w-full md:max-w-md">
                <form className="relative flex items-center" action="/search">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    name="q"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors" 
                    placeholder="Search courses..." 
                    type="search"
                    defaultValue={searchParams?.q}
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        <div className="container px-4 md:px-6 mx-auto py-8 max-w-7xl flex-1">
          {courses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No courses found</h3>
              <p className="text-slate-500 mb-6">Try searching for a different keyword or course code.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button variant="outline" asChild className="min-w-[140px]">
                      <Link href="/">
                          <Home className="w-4 h-4 mr-2" />
                          Go Home
                      </Link>
                  </Button>
                  <CreateCourseButton variant="default" className="min-w-[140px]" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  initialEnrolled={enrolledCourseIds.includes(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
