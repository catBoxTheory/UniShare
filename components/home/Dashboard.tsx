"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { CourseCard } from "@/components/course/CourseCard"
import { Clock, Library, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CreateCourseButton } from "@/components/course/CreateCourseButton"

interface Course {
  id: string
  title: string
  code: string
  department?: {
    name: string
  } | null
  isEnrolled?: boolean
}

interface DashboardProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  recentCourses: Course[]
  enrolledCourses: Course[]
}

export function Dashboard({ user, recentCourses, enrolledCourses, initialTab = "home" }: DashboardProps & { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl space-y-8">
            {activeTab === "home" && (
              <div className="space-y-8">
                {/* Recent Views */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">Recently Viewed</h2>
                  </div>
                  
                  {recentCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {recentCourses.map(course => (
                        <CourseCard key={course.id} course={course} initialEnrolled={course.isEnrolled} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                      <p className="text-slate-500">You haven't viewed any courses yet.</p>
                      <Button variant="link" onClick={() => setActiveTab("library")}>
                        Go to Library
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === "library" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Library className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">My Library</h2>
                  </div>
                  {enrolledCourses.length > 0 && <CreateCourseButton variant="outline" size="sm" />}
                </div>

                {enrolledCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {enrolledCourses.map(course => (
                      <CourseCard key={course.id} course={course} initialEnrolled={true} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Your library is empty</h3>
                    <p className="text-slate-500 mb-6">Add courses to your library to access them quickly.</p>
                    <div className="flex justify-center gap-4">
                      <Button asChild>
                        <Link href="/search">Browse Courses</Link>
                      </Button>
                      <CreateCourseButton variant="outline" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
