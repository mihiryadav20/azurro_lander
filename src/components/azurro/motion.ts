import type { Variants } from "motion/react"

// Expo-out: leaves fast, settles long. Reads as precise rather than playful,
// which is what the rest of this page is going for.
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const viewportOnce = { once: true, amount: 0.25 } as const
export const viewportEarly = { once: true, amount: 0.15 } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export const fadeUpTight: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
}

export function stagger(staggerChildren = 0.07, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren } },
  }
}

// Occupancy cells resolve column by column so the grid reads like the day
// filling in, 17:00 through 22:00, rather than everything landing at once.
export const gridCell: Variants = {
  hidden: { opacity: 0 },
  visible: (col: number) => ({
    opacity: 1,
    transition: { duration: 0.35, delay: 0.05 + col * 0.07, ease: EASE },
  }),
}

// The one cell the whole product exists to surface. Blinks twice on arrival,
// then holds — an alert, not an ornament, so it must not loop forever.
export const unbookedCell: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [0, 1, 0.4, 1, 0.4, 1],
    transition: {
      duration: 1.5,
      delay: 0.05 + 4 * 0.07,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      ease: "linear",
    },
  },
}

// The full-screen states (quiz, loader, confirmation) hand off one at a time
// rather than cross-fading: each covers the one before it, so the page behind
// never flashes through the seam. Exit is quicker than enter so the incoming
// state is already opaque by the time the outgoing one clears.
export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.28, ease: EASE } },
}

// Content settles just after its backdrop, so the panel reads as arriving
// rather than being revealed all at once.
export const overlayContent: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay: 0.1 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: EASE } },
}

// Step-to-step inside the quiz. Shorter than the overlay moves — it is the
// same surface changing its contents, not a new surface arriving.
export const quizStep: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18, ease: EASE } },
}

export const livePulse: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [1, 0.55, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
}
