"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { CourseCard } from "@/components/course/CourseCard"
import { Clock, Library, BookOpen, FileText, TrendingUp, Star, Flame } from "lucide-react"
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

interface DashboardStats {
  enrolledCount: number
  totalMaterials: number
  newThisWeek: number
  yourUploads: number
}

interface TrendingCourse {
  id: string
  title: string
  code: string
  department?: { name: string } | null
  materialCount: number
  recentCount: number
}

interface DashboardProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  recentCourses: Course[]
  enrolledCourses: Course[]
  stats?: DashboardStats | null
  trendingCourses?: TrendingCourse[]
}

export function Dashboard({ user, recentCourses, enrolledCourses, stats, trendingCourses, initialTab = "home" }: DashboardProps & { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl space-y-8">
            {activeTab === "home" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Library className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{stats.enrolledCount}</p>
                        <p className="text-xs text-muted-foreground">Enrolled Courses</p>
                      </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{stats.totalMaterials}</p>
                        <p className="text-xs text-muted-foreground">Total Materials</p>
                      </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{stats.newThisWeek}</p>
                        <p className="text-xs text-muted-foreground">New This Week</p>
                      </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{stats.yourUploads}</p>
                        <p className="text-xs text-muted-foreground">Ratings Given</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trending Courses */}
                {trendingCourses && trendingCourses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-5 h-5 text-emerald-500" />
                      <h2 className="text-xl font-bold text-foreground">Trending Courses</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {trendingCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Views */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Recently Viewed</h2>
                  </div>
                  
                  {recentCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {recentCourses.map(course => (
                        <CourseCard key={course.id} course={course} initialEnrolled={course.isEnrolled} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <p className="text-muted-foreground">You haven't viewed any courses yet.</p>
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
                    <Library className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">My Library</h2>
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
                  <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Your library is empty</h3>
                    <p className="text-muted-foreground mb-6">Add courses to your library to access them quickly.</p>
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
