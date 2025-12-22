import Link from "next/link";
import { Search, BookOpen, Plus, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCourses } from "@/app/actions/courses";
import { CreateCourseButton } from "@/components/course/CreateCourseButton";

export default async function Home() {
  // Fetch real courses from the database
  const courses = await getCourses();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white">
              Share & Learn Together
            </h1>
            <p className="mx-auto max-w-[700px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Upload lecture videos, notes, and study materials. Access resources shared by students from your university.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full max-w-lg mx-auto">
            <form className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                className="pl-12 h-14 text-lg shadow-lg border-0 focus-visible:ring-2 focus-visible:ring-white rounded-full bg-white" 
                placeholder="Search for courses (e.g. CS101)..." 
                type="search"
              />
            </form>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <CreateCourseButton />
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="w-full py-16 bg-slate-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Courses
            </h2>
            <CreateCourseButton variant="outline" />
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No courses yet</h3>
              <p className="text-slate-500 mb-6">Be the first to create a course and start sharing!</p>
              <CreateCourseButton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <Link href={`/courses/${course.id}`} key={course.id} className="group">
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-slate-200 hover:border-blue-300">
                    <div className="h-28 bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 transition-colors flex items-center justify-center">
                      <span className="text-3xl font-bold text-white/90">{course.code}</span>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.department && (
                        <p className="text-sm text-slate-500">{course.department.name}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {/* Create New Course Card */}
              <CreateCourseCard />
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-white border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-12 text-center">
            Everything you need for studying
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Document Preview</h3>
              <p className="text-slate-500 text-sm">
                Preview PDF, Jupyter Notebooks, and PowerPoint files directly in your browser.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Video Streaming</h3>
              <p className="text-slate-500 text-sm">
                Watch lecture videos with a YouTube-style player and playlist.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Easy Uploads</h3>
              <p className="text-slate-500 text-sm">
                Drag and drop files to share with your classmates instantly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Create Course Card Component (inline for simplicity)
function CreateCourseCard() {
  return (
    <div className="group">
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50">
        <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Plus className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
            Create New Course
          </h3>
          <p className="text-sm text-slate-500 mt-1">Add your course materials</p>
        </div>
      </Card>
    </div>
  );
}
