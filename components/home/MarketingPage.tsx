"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Share2, Search, Upload, Heart, FileText, Video, MessageCircle, Star, Library, Shield, Zap } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find your exact course",
    desc: "Search by course code, professor name, or university. Our precise cataloging system ensures you find materials relevant to your exact syllabus, not just generic topics.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Access premium materials instantly",
    desc: "No subscription required. Download PDFs, watch lectures, and read notes right in your browser. All content organized by week and topic for easy navigation.",
  },
  {
    number: "03",
    icon: Upload,
    title: "Give back to the community",
    desc: "Upload your own notes and help the next cohort. High-quality contributions are upvoted, building your reputation as a top contributor.",
  },
]

const values = [
  { icon: Shield, title: "Strictly No Paywalls", desc: "We fundamentally oppose monetizing basic course materials. Every note, video, and guide on UniShare is 100% free, forever." },
  { icon: Users, title: "Peer Reviewed", desc: "Quality is maintained through a robust upvote system. The most accurate and helpful resources naturally rise to the top." },
  { icon: Zap, title: "Academic Integrity", desc: "We share study guides and notes, not assignments or test answers. Our platform promotes learning, not shortcuts." },
]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4])

  return (
    <div ref={ref} className="absolute inset-0 z-0 overflow-hidden">
      <motion.video
        autoPlay muted loop playsInline
        style={{ scale, opacity }}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/c_f_a_c_c_b_cdmp_.mp4" type="video/mp4" />
      </motion.video>
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  )
}

export function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar variant="default" />

      {/* ===== Hero ===== */}
      <section className="relative min-h-[90dvh] flex items-center overflow-hidden isolate">
        <HeroVideo />

        <div className="relative z-10 container px-4 md:px-6 mx-auto py-32 lg:py-40">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-2xl">
            <motion.div variants={fadeUpItem}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-6">
                <Star className="h-4 w-4 text-emerald-400" />
                <span>By students, for students. Always free.</span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUpItem} className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-6 leading-[1.1] tracking-tighter">
              Academic knowledge{" "}
              <span className="text-emerald-400 italic">without boundaries.</span>
            </motion.h1>

            <motion.p variants={fadeUpItem} className="text-lg sm:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
              Access lecture notes, course videos, and study materials shared by your peers. No paywalls, no credit systems — just shared learning.
            </motion.p>

            <motion.div variants={fadeUpItem} className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-semibold text-base h-12 px-8 bg-emerald-600 hover:bg-emerald-500">
                <Link href="/register">
                  Join the Community <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold text-base h-12 px-8 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link href="/signin">Explore Resources</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== Bento Grid Features ===== */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-muted/30 to-transparent pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-4">
              Everything you need to excel.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              A unified platform for all your academic resources, curated and verified by students like you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Large card — Lecture Notes */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-3 glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen className="w-48 h-48" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-3xl font-serif mb-4 tracking-tight">Comprehensive Lecture Notes</h3>
                  <p className="text-muted-foreground text-lg max-w-md mb-8">
                    Stop scrambling to copy down slides. Access beautifully formatted, peer-reviewed notes for your specific courses, updated after every lecture.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-6 border border-border/50 max-w-sm transform group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-serif font-medium text-sm">CS</div>
                    <div>
                      <h4 className="font-medium text-sm">Data Structures &amp; Algorithms</h4>
                      <p className="text-xs text-muted-foreground">Prof. Smith &middot; Fall 2023</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full w-3/4 bg-primary/40 rounded-full" /></div>
                    <div className="h-2 w-5/6 bg-muted rounded-full overflow-hidden"><div className="h-full w-2/3 bg-primary/40 rounded-full" /></div>
                    <div className="h-2 w-4/6 bg-muted rounded-full overflow-hidden"><div className="h-full w-1/2 bg-primary/40 rounded-full" /></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stacked right column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex-1 glass-card rounded-3xl p-8 relative overflow-hidden group"
              >
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Video className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif mb-2 tracking-tight">Recorded Lectures</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Rewatch complex topics at your own pace. High-quality community recordings with timestamps and bilingual subtitles.
                  </p>
                  <div className="aspect-video rounded-xl bg-muted relative overflow-hidden group/vid cursor-pointer border border-border/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-stone-900/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover/vid:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex-1 glass-card rounded-3xl p-8 relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif mb-2 tracking-tight">Community Driven</h3>
                  <p className="text-muted-foreground text-sm">
                    No artificial barriers. Knowledge is verified through community upvotes and peer reviews from students who took the exact same course.
                  </p>
                  <div className="mt-6 flex -space-x-2">
                    {["A", "M", "K", "J"].map((init, i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium">
                        {init}
                      </div>
                    ))}
                    <div className="w-9 h-9 rounded-full border-2 border-card bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium z-10">
                      +2k
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-4">How UniShare works.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              A simple, transparent process designed to get you the information you need, faster.
            </p>
          </motion.div>

          <div className="space-y-24 md:space-y-32">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col gap-12 lg:gap-20 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center`}
              >
                <div className="w-full md:w-1/2">
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden glass-card border border-border p-2">
                    <div className="w-full h-full rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                      <step.icon className="h-16 w-16 text-primary/40 mb-6" />
                      <span className="font-serif font-bold text-[10rem] text-primary/5 absolute inset-0 flex items-center justify-center select-none leading-none">
                        {step.number}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2 max-w-lg">
                  <div className="text-primary font-serif text-6xl opacity-20 mb-4">{step.number}</div>
                  <h3 className="text-3xl font-serif mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Community Values — asymmetric ===== */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-4">Our core values.</h2>
              <p className="text-muted-foreground text-lg max-w-lg mb-10">
                We believe education should be accessible to everyone, not just those who can afford expensive subscription services.
              </p>
              <div className="flex gap-12">
                <div>
                  <div className="text-4xl font-bold tracking-tighter">100%</div>
                  <div className="text-sm text-muted-foreground mt-1">Free, forever</div>
                </div>
                <div>
                  <div className="text-4xl font-bold tracking-tighter">Open</div>
                  <div className="text-sm text-muted-foreground mt-1">Source ethos</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              viewport={{ once: true }}
              className="space-y-1"
            >
              {values.map((v) => (
                <div
                  key={v.title}
                  className="flex items-center gap-4 p-5 rounded-2xl hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{v.title}</p>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
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
