"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Share2, Search, Upload, Heart } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const steps = [
  {
    icon: Search,
    title: "Find your course",
    desc: "Search for your university and course. Everything is organized by department and course code.",
  },
  {
    icon: BookOpen,
    title: "Access materials",
    desc: "Browse lecture notes, videos, and study resources shared by students who took the course before you.",
  },
  {
    icon: Upload,
    title: "Contribute back",
    desc: "Upload your own notes and help the next cohort. The more we share, the better it gets for everyone.",
  },
]

const values = [
  { icon: Users, title: "Community first", desc: "Everyone contributes, everyone benefits." },
  { icon: Share2, title: "Share freely", desc: "No restrictions, no credit systems, no limits." },
  { icon: Heart, title: "Made with care", desc: "Built by a student who was tired of paywalled resources." },
]

export function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar variant="default" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-amber-100 dark:border-amber-900/20">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Warm overlay for text readability */}
        <div className="absolute inset-0 bg-amber-50/60 dark:bg-black/60 -z-10" />
        <div className="container px-4 md:px-6 mx-auto py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Your course materials,{" "}
              <span className="text-amber-700 dark:text-amber-400">shared freely.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              UniShare is where students share lecture notes, videos, and resources —
              no paywalls, no credit systems, just a community that helps each other succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="font-semibold text-base h-12 px-8">
                <Link href="/register">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold text-base h-12 px-8">
                <Link href="/signin">
                  Sign In
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps to start learning together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-3"
              >
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto">
                  <step.icon className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Values */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                  Built by students,{" "}
                  <span className="text-amber-700 dark:text-amber-400">for students.</span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  No venture capital. No paywalls. No &ldquo;premium&rdquo; content locked behind credit systems.
                  Just a straightforward place to find and share course materials with your classmates.
                </p>
                <div className="flex gap-8 pt-4">
                  <div>
                    <div className="text-3xl font-bold">100%</div>
                    <div className="text-sm text-muted-foreground">Free, forever</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">Open</div>
                    <div className="text-sm text-muted-foreground">Source ethos</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 space-y-6"
              >
                {values.map((v) => (
                  <div key={v.title} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <v.icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{v.title}</p>
                      <p className="text-sm text-muted-foreground">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to start learning?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Join students who are already sharing and learning together.
          </p>
          <Button asChild size="lg" className="font-semibold h-12 px-8">
            <Link href="/register">Join UniShare &mdash; it&apos;s free</Link>
          </Button>
        </div>
      </section>

      <Footer variant="default" />
    </div>
  )
}
