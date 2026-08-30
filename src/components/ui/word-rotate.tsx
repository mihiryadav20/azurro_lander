import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
} from "motion/react"

import { cn } from "@/lib/utils"

const WIDTH_TRANSITION = { duration: 0.4, ease: "easeInOut" as const }

interface WordRotateProps {
  words: string[]
  duration?: number
  motionProps?: MotionProps
  className?: string
}

export function WordRotate({
  words,
  duration = 2800,
  motionProps = {
    initial: { opacity: 0, y: "-100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "100%" },
    transition: WIDTH_TRANSITION,
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  // Measured in px per word, rather than one fixed max-width: font metrics
  // for a caps display face don't map cleanly to character-count units, and
  // sizing to each word's own width (instead of the longest) keeps the gap
  // before the trailing text a normal single word-space on every word. This
  // self-corrects at every breakpoint since clamp()'d font-size changes the
  // measured widths too.
  const measureRef = useRef<HTMLSpanElement>(null)
  const [widths, setWidths] = useState<number[]>([])

  useLayoutEffect(() => {
    const measure = () => {
      const el = measureRef.current
      if (!el) return
      setWidths(
        Array.from(el.children).map(
          (child) => (child as HTMLElement).getBoundingClientRect().width
        )
      )
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [words, className])

  useEffect(() => {
    // Reduced motion: hold on the first word, never animate or advance.
    if (reduceMotion) return
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [words, duration, reduceMotion])

  const currentWidth = widths[index]

  return (
    <span className="relative inline-block align-bottom">
      {/* Off-screen, same classes as the visible word so widths match
          exactly. Not display:none — that would report 0 width. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex whitespace-nowrap"
      >
        {words.map((word) => (
          <span key={word} className={cn("inline-block", className)}>
            {word}
          </span>
        ))}
      </span>

      {reduceMotion ? (
        <span className={cn("inline-block", className)}>{words[0]}</span>
      ) : (
        <motion.span
          className="inline-block overflow-hidden align-bottom"
          initial={false}
          animate={{ width: currentWidth }}
          transition={WIDTH_TRANSITION}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={words[index]}
              className={cn("inline-block", className)}
              {...motionProps}
            >
              {words[index]}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      )}
    </span>
  )
}
