"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, GraduationCap, Users, Shield, Zap } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { ThemeProvider } from "@/components/theme-provider"

export function MarketingPage() {
  return (
    <ThemeProvider forcedTheme="light">
      <div className="flex flex-col min-h-screen bg-white text-slate-900">
        <Navbar variant="solid" />
        {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white pb-20 pt-32 lg:pt-40">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Master your studies with <span className="text-blue-200">UniShare</span>
              </h1>
              <p className="max-w-[600px] text-lg md:text-xl text-blue-100/90">
                Access millions of study documents, lecture videos, and notes shared by students from your university. Join the community today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-lg h-12 px-8">
                  <Link href="/register">
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10 font-bold text-lg h-12 px-8">
                  <Link href="/signin">
                    Log In
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="absolute bottom-0 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl -z-10" />
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">CS101 - Intro to CS</h3>
                    <p className="text-blue-200 text-sm">City University of Hong Kong</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-white/20 rounded w-3/4" />
                  <div className="h-2 bg-white/20 rounded w-full" />
                  <div className="h-2 bg-white/20 rounded w-5/6" />
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-red-400 border-2 border-indigo-900" />
                    <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-indigo-900" />
                    <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-indigo-900" />
                  </div>
                  <span className="text-sm text-blue-200">Active now</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to excel</h2>
            <p className="mt-4 text-lg text-slate-600">UniShare provides the tools and resources to help you succeed in your academic journey.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Verified Content</h3>
              <p className="text-slate-600">Access high-quality study materials vetted by top students and professors.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Instant Access</h3>
              <p className="text-slate-600">Find exactly what you need in seconds with our powerful search engine.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Community Driven</h3>
              <p className="text-slate-600">Connect with classmates, share resources, and study together effectively.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">Ready to start learning?</h2>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8">
            <Link href="/register">Join UniShare Now</Link>
          </Button>
        </div>
      </section>
      <Footer variant="solid" />
      </div>
    </ThemeProvider>
  )
}

