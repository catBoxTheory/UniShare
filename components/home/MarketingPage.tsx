"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Share2, Search, Upload, Heart, FileText, Video, MessageCircle } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find your course",
    desc: "Search for your university and course. Everything is organized by department and course code.",
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Access materials",
    desc: "Browse lecture notes, videos, and study resources shared by students who took the course before you.",
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    number: "03",
    icon: Upload,
    title: "Contribute back",
    desc: "Upload your own notes and help the next cohort. The more we share, the better it gets for everyone.",
    gradient: "from-teal-600 to-emerald-800",
  },
]

const bentoCards = [
  {
    icon: FileText,
    title: "Lecture notes",
    desc: "Thousands of student-contributed notes across every department.",
    gradient: "from-emerald-500 to-emerald-700",
    span: "md:row-span-2 md:col-span-2",
  },
  {
    icon: Video,
    title: "Course videos",
    desc: "Watch recorded lectures with bilingual subtitles.",
    gradient: "from-emerald-600 to-teal-700",
    span: "",
  },
  {
    icon: MessageCircle,
    title: "Community driven",
    desc: "No paywalls, no credit systems. Just students helping students.",
    gradient: "from-teal-600 to-emerald-800",
    span: "",
  },
]

const values = [
  { icon: Users, title: "Community first", desc: "Everyone contributes, everyone benefits." },
  { icon: Share2, title: "Share freely", desc: "No restrictions, no credit systems, no limits." },
  { icon: Heart, title: "Made with care", desc: "Built by a student who was tired of paywalled resources." },
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

export function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar variant="default" />

      {/* ===== Hero — left-aligned, video background ===== */}
      <section className="relative overflow-hidden border-b border-emerald-100 dark:border-emerald-900/20">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/65 via-stone-950/35 to-stone-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="relative container px-4 md:px-6 mx-auto py-32 lg:py-40">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-2xl">
            <motion.h1 variants={fadeUpItem} className="font-serif text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95]">
              Your course materials,{" "}
              <span className="text-emerald-300">shared freely.</span>
            </motion.h1>
            <motion.p variants={fadeUpItem} className="mt-6 max-w-xl text-lg md:text-xl text-white/70 leading-relaxed">
              UniShare is where students share lecture notes, videos, and resources
              &mdash; no paywalls, no credit systems, just a community that helps each
              other succeed.
            </motion.p>
            <motion.div variants={fadeUpItem} className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="font-semibold text-base h-12 px-8">
                <Link href="/register">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold text-base h-12 px-8 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link href="/signin">Sign In</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== Featured Bento Grid ===== */}
      <section className="py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-300 uppercase mb-4">
              Everything you need
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter max-w-2xl">
              All your course resources,{" "}
              <span className="text-emerald-700 dark:text-emerald-300">in one place.</span>
            </h2>
          </motion.div>

          {/* Bento grid — asymmetric: 1 large card + 2 smaller */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[240px]">
            {bentoCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={card.span}
              >
                <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${card.gradient} h-full group cursor-pointer`}>
                  {/* Abstract geometric decoration */}
                  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-700" />
                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-end h-full p-8">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-3">
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                    <p className="text-sm text-white/70 leading-relaxed max-w-xs">{card.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works — zig-zag with gradient panels ===== */}
      <section className="py-32 bg-muted/30 border-y border-border">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-300 uppercase mb-4">
              How it works
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter">
              Three steps to start{" "}
              <span className="text-emerald-700 dark:text-emerald-300">learning together.</span>
            </h2>
          </motion.div>

          <div className="space-y-28">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  i % 2 === 1 ? "md:[direction:rtl]" : ""
                }`}
              >
                {/* Gradient panel side */}
                <div className={i % 2 === 1 ? "[direction:ltr]" : ""}>
                  <div className={`relative overflow-hidden rounded-[2rem] aspect-[4/3] bg-gradient-to-br ${step.gradient} group`}>
                    {/* Watermark number */}
                    <span className="absolute inset-0 flex items-center justify-center font-serif font-bold text-[14rem] text-white/10 select-none leading-none">
                      {step.number}
                    </span>
                    {/* Floating decorative circles */}
                    <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-10 right-20 w-12 h-12 rounded-full bg-white/8 group-hover:scale-125 transition-transform duration-500" />
                    {/* Icon badge */}
                    <div className="absolute bottom-6 left-6 w-14 h-14 bg-white/90 dark:bg-stone-900/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
                      <step.icon className="w-7 h-7 text-emerald-700 dark:text-emerald-300" />
                    </div>
                  </div>
                </div>
                {/* Text side */}
                <div className={i % 2 === 1 ? "[direction:ltr]" : ""}>
                  <h3 className="text-2xl font-bold tracking-tight mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Community Values — asymmetric grid ===== */}
      <section className="py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-300 uppercase mb-4">
                Our values
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-6">
                Built by students,{" "}
                <span className="text-emerald-700 dark:text-emerald-300">for students.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                No venture capital. No paywalls. No &ldquo;premium&rdquo; content locked behind
                credit systems. Just a straightforward place to find and share course
                materials with your classmates.
              </p>
              <div className="flex gap-12 mt-8">
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
                  className="flex items-center gap-4 p-5 rounded-2xl hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <v.icon className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
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

      {/* ===== Final CTA ===== */}
      <section className="py-32 bg-muted/30 border-t border-border">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Ready to start learning?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Join students who are already sharing and learning together.
            </p>
            <Button asChild size="lg" className="font-semibold h-12 px-8">
              <Link href="/register">Join UniShare &mdash; it&apos;s free</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer variant="default" />
    </div>
  )
}
