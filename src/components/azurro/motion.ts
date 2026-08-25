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

export const livePulse: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [1, 0.55, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
}
