"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, FileText, Video, Users, Shield, Zap, Search, Home, BookMarked, Settings, BarChart3, Clock } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
}

const steps = [
  { number: "01", title: "Find your course", desc: "Search by course code, professor name, or university. Our cataloging system ensures you find materials for your exact syllabus." },
  { number: "02", title: "Access materials instantly", desc: "No subscription required. Download PDFs, watch lectures, and read notes in your browser — organized by week and topic." },
  { number: "03", title: "Give back to peers", desc: "Upload your own notes or recordings. High-quality contributions are upvoted, building your reputation as a top contributor." },
]

const values = [
  { icon: Shield, title: "Strictly No Paywalls", desc: "Every note, video, and guide on UniShare is 100% free, forever. We fundamentally oppose monetizing basic course materials." },
  { icon: Users, title: "Peer Reviewed", desc: "Quality is maintained through a robust upvote system. The most accurate and helpful resources naturally rise to the top." },
  { icon: Zap, title: "Academic Integrity", desc: "We share study guides and notes, not assignments or test answers. Our platform promotes learning, not shortcuts." },
]

const trendingCourses = [
  { code: "CS 310", title: "Design & Analysis of Algorithms", dept: "Computer Science", materials: 24, weekly: 8 },
  { code: "ECON 201", title: "Microeconomics", dept: "Economics", materials: 18, weekly: 5 },
  { code: "STAT 200", title: "Probability & Statistics", dept: "Mathematics", materials: 31, weekly: 12 },
]

const recentCourses = [
  { code: "CS 201", title: "Data Structures", dept: "Computer Science", materials: 16, viewed: "2h ago" },
  { code: "GE 1301", title: "English for Academic Purposes", dept: "General Education", materials: 9, viewed: "yesterday" },
  { code: "MATH 201", title: "Linear Algebra", dept: "Mathematics", materials: 22, viewed: "3 days ago" },
]

const sidebarItems = [
  { icon: Home, label: "Home", active: true },
  { icon: BookMarked, label: "Library" },
  { icon: Search, label: "Search" },
  { icon: Clock, label: "Saved" },
  { icon: Settings, label: "Settings" },
]

export function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar variant="default" />

      {/* ===== Hero ===== */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-emerald-950/80 to-stone-950" />
        {/* Radial glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_400px_at_20%_50%,rgba(16,185,129,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_400px_300px_at_80%_30%,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
        {/* Grid pattern */}
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-[0.06] bg-[linear-gradient(to_bottom,rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,1)_1px,transparent_1px)] bg-[length:60px_60px] [mask-image:linear-gradient(to_left,black_0%,transparent_100%)] pointer-events-none" />

        {/* Floating course cards */}
        <div className="hidden md:block absolute right-[8%] top-[20%] z-10 bg-white/[0.06] border border-white/10 rounded-2xl backdrop-blur-xl p-5 animate-[float_6s_ease-in-out_infinite]">
          <div className="text-sm font-semibold text-white mb-1">CS 310 — Algorithms</div>
          <div className="text-xs text-white/60 mb-3">Midterm Review · 14 materials</div>
          <div className="h-1.5 rounded-full bg-white/10 mb-1.5 overflow-hidden"><div className="h-full w-3/4 rounded-full bg-emerald-400" /></div>
          <div className="h-1.5 rounded-full bg-white/10 mb-1.5 overflow-hidden"><div className="h-full w-3/5 rounded-full bg-emerald-400" /></div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-[45%] rounded-full bg-emerald-400" /></div>
        </div>

        <div className="hidden md:block absolute right-[15%] bottom-[25%] z-10 bg-white/[0.06] border border-white/10 rounded-2xl backdrop-blur-xl p-5 animate-[float_6s_ease-in-out_infinite_2s]">
          <div className="text-sm font-semibold text-white mb-1">ECON 201 — Microeconomics</div>
          <div className="text-xs text-white/60 mb-3">Lecture 08 · Prof. Lee</div>
          <div className="h-1.5 rounded-full bg-white/10 mb-1.5 overflow-hidden"><div className="h-full w-[90%] rounded-full bg-emerald-400" /></div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-[70%] rounded-full bg-emerald-400" /></div>
        </div>

        <div className="hidden xl:block absolute right-[4%] bottom-[35%] z-10 bg-white/[0.06] border border-white/10 rounded-2xl backdrop-blur-xl p-5 animate-[float_6s_ease-in-out_infinite_4s]">
          <div className="text-sm font-semibold text-white mb-1">STAT 200 — Probability</div>
          <div className="text-xs text-white/60 mb-3">Tutorial Notes · Week 10</div>
          <div className="h-1.5 rounded-full bg-white/10 mb-1.5 overflow-hidden"><div className="h-full w-[55%] rounded-full bg-emerald-400" /></div>
          <div className="h-1.5 rounded-full bg-white/10 mb-1.5 overflow-hidden"><div className="h-full w-[80%] rounded-full bg-emerald-400" /></div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-[35%] rounded-full bg-emerald-400" /></div>
        </div>

        {/* Fade to bg at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

        {/* Content */}
        <div className="relative z-20 container px-4 md:px-6 mx-auto py-32 lg:py-40">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-2xl">
            <motion.div variants={fadeUpItem}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white/90 text-sm font-medium mb-8">
                <Star className="h-4 w-4 text-emerald-400" />
                <span>By students, for students. Always free.</span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUpItem} className="font-serif text-5xl sm:text-6xl md:text-7xl text-white mb-6 leading-[1.05] tracking-tighter">
              Academic knowledge<br />
              <span className="text-emerald-400 italic">without boundaries.</span>
            </motion.h1>

            <motion.p variants={fadeUpItem} className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
              Access lecture notes, course videos, and study materials shared by your peers. No paywalls, no credit systems — just shared learning.
            </motion.p>

            <motion.div variants={fadeUpItem} className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-semibold text-base h-12 px-8 bg-emerald-600 hover:bg-emerald-500">
                <Link href="/register">
                  Join the Community <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold text-base h-12 px-8 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link href="/signin">Explore Resources</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-24 bg-background relative">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">What you get</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-4">Everything you need to excel.</h2>
            <p className="text-muted-foreground text-lg max-w-xl">A unified platform for all your academic resources, curated and verified by students like you.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Large spanning card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 md:p-10 grid lg:grid-cols-2 gap-10 items-center hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold tracking-tight mb-3">Comprehensive Lecture Notes</h3>
                <p className="text-muted-foreground leading-relaxed">Stop scrambling to copy down slides. Access beautifully formatted, peer-reviewed notes for your specific courses, updated after every lecture.</p>
              </div>
              <div className="bg-background border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">CS</div>
                  <div>
                    <div className="text-sm font-semibold">Data Structures & Algorithms</div>
                    <div className="text-xs text-muted-foreground">Prof. Smith · Fall 2025</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-primary/10" />
                  <div className="h-2 rounded-full bg-border w-3/5" />
                  <div className="h-2 rounded-full bg-border" />
                  <div className="h-2 rounded-full bg-border w-4/5" />
                  <div className="h-2 rounded-full bg-primary/10 w-3/5" />
                  <div className="h-2 rounded-full bg-border" />
                  <div className="h-2 rounded-full bg-border w-3/5" />
                </div>
              </div>
            </motion.div>

            {/* Recorded Lectures */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-3xl p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold tracking-tight mb-3">Recorded Lectures</h3>
              <p className="text-muted-foreground text-sm mb-5 leading-relaxed">Rewatch complex topics at your own pace. Community recordings with timestamps and bilingual subtitles.</p>
              <div className="aspect-video rounded-xl bg-gradient-to-br from-emerald-900/30 via-stone-900/20 to-stone-900/10 relative overflow-hidden border border-border cursor-pointer group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Community Driven */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-3xl p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold tracking-tight mb-3">Community Driven</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Knowledge is verified through community upvotes and peer reviews from students who took the exact same course.</p>
              <div className="mt-6 flex -space-x-2">
                {["A", "M", "K"].map((init, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium">{init}</div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-card bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium z-10">+2k</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "100%", label: "Free, forever" },
              { num: "Open", label: "Source ethos" },
              { num: "2,400+", label: "Materials shared" },
              { num: "850+", label: "Active students" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                viewport={{ once: true }}
              >
                <div className="font-serif text-4xl md:text-5xl font-bold tracking-tighter">{stat.num}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">How it works</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-3">Three steps to smarter studying.</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">A simple, transparent process designed to get you the information you need, faster.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-bold tracking-widest text-primary">{step.number}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <h3 className="font-serif text-2xl font-bold tracking-tight mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Our principles</p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-4">Built on shared values.</h2>
              <p className="text-muted-foreground text-lg max-w-lg mb-10 leading-relaxed">
                We believe education should be accessible to everyone, not just those who can afford expensive subscription services.
              </p>
              <div className="flex gap-12">
                <div>
                  <div className="font-serif text-4xl font-bold tracking-tighter">100%</div>
                  <div className="text-sm text-muted-foreground mt-1">Free, forever</div>
                </div>
                <div>
                  <div className="font-serif text-4xl font-bold tracking-tighter">Open</div>
                  <div className="text-sm text-muted-foreground mt-1">Source ethos</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              {values.map((v) => (
                <div
                  key={v.title}
                  className="flex items-start gap-4 p-5 rounded-2xl hover:bg-primary/5 transition-colors duration-300 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <v.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1">{v.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Dashboard Preview ===== */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Your workspace</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-3">A dashboard built for focus.</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">Everything you need, nothing you don&apos;t. Track your courses, discover new materials, and stay on top of your studies.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Dashboard topbar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-border">
              <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-sm text-muted-foreground min-w-[240px]">
                <Search className="h-4 w-4" />
                <span>Search courses, materials...</span>
                <kbd className="ml-auto text-[11px] px-1.5 py-0.5 bg-card border border-border rounded font-mono">⌘K</kbd>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">W</div>
                <span className="text-sm font-semibold">Wilson</span>
              </div>
            </div>

            <div className="grid grid-cols-[220px_1fr] min-h-[480px] max-md:grid-cols-1">
              {/* Sidebar */}
              <div className="border-r border-border p-5 bg-background max-md:hidden">
                {sidebarItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium mb-1 cursor-pointer transition-colors ${
                      item.active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="p-6">
                <div className="font-serif text-2xl font-bold tracking-tight mb-6">Good morning, Wilson</div>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: BookMarked, val: "8", label: "Enrolled Courses", color: "" },
                    { icon: FileText, val: "47", label: "Total Materials", color: "" },
                    { icon: BarChart3, val: "5", label: "New This Week", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" },
                    { icon: Star, val: "12", label: "Ratings Given", color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" },
                  ].map((s) => (
                    <div key={s.label} className="bg-background border border-border rounded-2xl p-5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color || "bg-primary/10 text-primary"}`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="font-mono text-2xl font-bold tracking-tight">{s.val}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Trending */}
                <div className="flex items-center gap-2 font-semibold text-base mb-4">
                  <BarChart3 className="w-[18px] h-[18px] text-primary" />
                  Trending Courses
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {trendingCourses.map((c) => (
                    <div key={c.code} className="bg-background border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                      <div className="text-[11px] font-bold tracking-widest text-primary mb-1.5">{c.code}</div>
                      <div className="text-sm font-bold mb-1 leading-snug">{c.title}</div>
                      <div className="text-xs text-muted-foreground mb-3">{c.dept}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.materials} materials</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>{c.weekly} this week</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recently Viewed */}
                <div className="flex items-center gap-2 font-semibold text-base mb-4">
                  <Clock className="w-[18px] h-[18px] text-primary" />
                  Recently Viewed
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentCourses.map((c) => (
                    <div key={c.code} className="bg-background border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                      <div className="text-[11px] font-bold tracking-widest text-primary mb-1.5">{c.code}</div>
                      <div className="text-sm font-bold mb-1 leading-snug">{c.title}</div>
                      <div className="text-xs text-muted-foreground mb-3">{c.dept}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.materials} materials</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>Viewed {c.viewed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/20 rounded-full blur-3xl" />

        <div className="container relative z-10 px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-serif text-4xl md:text-6xl text-white mb-6 tracking-tighter">
              Ready to ace your semester?
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Join thousands of students already sharing knowledge and studying smarter on UniShare.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold h-12 px-8 shadow-lg">
                <Link href="/register">Create Free Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 font-semibold h-12 px-8">
                <Link href="/signin">Browse Courses First</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer variant="default" />
    </div>
  )
}
