"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface ParallaxTiltCardProps {
  imageUrl: string
  children: ReactNode
  className?: string
}

export function ParallaxTiltCard({ imageUrl, children, className = "" }: ParallaxTiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(y, [0, 1], [4, -4]), {
    stiffness: 200,
    damping: 22,
  })
  const rotateY = useSpring(useTransform(x, [0, 1], [-4, 4]), {
    stiffness: 200,
    damping: 22,
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width)
    y.set((e.clientY - rect.top) / rect.height)
  }

  const handleMouseLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY }}
      className={`relative overflow-hidden rounded-[2rem] cursor-pointer group ${className}`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      {/* Liquid Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
      {/* Gradient fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}
