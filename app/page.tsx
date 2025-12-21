"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Mock Data for Popular Courses
const POPULAR_COURSES = [
  { id: "CS101", code: "CS101", title: "Intro to Computer Science", university: "City University" },
  { id: "MATH201", code: "MATH201", title: "Calculus I", university: "City University" },
  { id: "ECON102", code: "ECON102", title: "Macroeconomics", university: "City University" },
  { id: "PHY101", code: "PHY101", title: "Physics I", university: "City University" },
  { id: "CHEM101", code: "CHEM101", title: "General Chemistry", university: "City University" },
  { id: "ENG101", code: "ENG101", title: "Academic Writing", university: "City University" },
];

// Mock Data for Recent Uploads
const RECENT_UPLOADS = [
  { id: 1, title: "Week 4 Lecture Notes", course: "CS101", time: "2 hours ago", type: "Lecture" },
  { id: 2, title: "Midterm Practice Exam", course: "MATH201", time: "5 hours ago", type: "Extra" },
  { id: 3, title: "Lab Report Template", course: "PHY101", time: "1 day ago", type: "Extra" },
];

export default function Home() {
  // #region agent log
  try {
    fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'app/page.tsx:Home',
        message: 'Home page rendering started',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'general-startup'
      })
    }).catch(() => {});
  } catch (e) {}
  // #endregion

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Basic mock logic: redirect to /courses/[query]
      // In a real app, this would go to a search results page
      router.push(`/courses/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-40 bg-white border-b">
        <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-slate-900">
              Find the study notes you need.
            </h1>
            <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Access thousands of lecture videos, notes, and exam prep materials shared by students like you.
            </p>
          </div>
          
          <div className="w-full max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                className="pl-10 h-14 text-lg shadow-sm border-slate-300 focus-visible:ring-blue-600 rounded-full" 
                placeholder="Search for courses (e.g. CS101)..." 
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>
      </section>

      {/* Popular Courses Grid */}
      <section className="w-full py-16 bg-slate-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Popular Courses</h2>
            <Link href="#" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {POPULAR_COURSES.map((course) => (
              <Link href={`/courses/${course.id}`} key={course.id} className="group">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md border-slate-200">
                  <div className="h-24 bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 transition-colors" />
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-700 transition-colors">{course.code}</h3>
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{course.title}</p>
                    <p className="text-xs text-slate-500 mt-2">{course.university}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Uploads List */}
      <section className="w-full py-16 bg-white border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-8 text-center">Recent Uploads</h2>
          
          <div className="space-y-4">
            {RECENT_UPLOADS.map((upload) => (
              <div key={upload.id} className="flex items-center p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{upload.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">{upload.course}</span>
                    <span>•</span>
                    <span>{upload.type}</span>
                  </div>
                </div>
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {upload.time}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
             <Button variant="outline">Load More Activity</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
