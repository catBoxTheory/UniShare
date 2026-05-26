import Link from "next/link";
import { Search, BookOpen, GraduationCap, Home, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/app/actions/courses";
import { CreateCourseButton } from "@/components/course/CreateCourseButton";
import { CourseCard } from "@/components/course/CourseCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Pagination } from "@/components/ui/pagination";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const session = await auth();
  const page = parseInt(searchParams.page || "1");
  const pageSize = 12;

  // Fetch paginated courses
  const result = await getCourses(searchParams?.q, undefined, page, pageSize);
  const courses = Array.isArray(result) ? result : result.courses;
  const pagination = Array.isArray(result) ? null : { page: result.page, totalPages: result.totalPages, total: result.total };

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
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header Section */}
        <div className="bg-card border-b border-border py-8">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6 group"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-border group-hover:border-primary/20">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Back to Dashboard
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  Search Results
                </h1>
                <p className="text-muted-foreground">
                  Showing results for &quot;{searchParams?.q || "all courses"}&quot;
                </p>
              </div>
              
              <div className="w-full md:max-w-md">
                <form className="relative flex items-center" action="/search">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    name="q"
                    className="pl-10 h-11 bg-background border-border focus:bg-background transition-colors" 
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
            <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed border-border">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6">Try searching for a different keyword or course code.</p>
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

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
            />
          )}
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
