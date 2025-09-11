"use client"

import { motion, useInView } from "framer-motion"
import { useRef, ReactNode } from "react"

interface ScrollAnimationProps {
  children: ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
  threshold?: number
}

export function ScrollAnimation({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.5,
  threshold = 0.1
}: ScrollAnimationProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  const getDirection = () => {
    switch (direction) {
      case "up":
        return { y: 40 }
      case "down":
        return { y: -40 }
      case "left":
        return { x: 40 }
      case "right":
        return { x: -40 }
      default:
        return { y: 40 }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...getDirection(),
      }}
      animate={{
        opacity: isInView ? 1 : 0,
        y: isInView ? 0 : getDirection().y,
        x: isInView ? 0 : getDirection().x,
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
