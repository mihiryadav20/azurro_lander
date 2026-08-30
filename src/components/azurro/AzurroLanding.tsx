import { Fragment, useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"
import { Menu, X } from "lucide-react"
import logo from "@/assets/azurro-logo.png"
import loaderAnimation from "@/assets/loader.webp"
import { Footer } from "@/components/footer"
import { QuizModal } from "@/components/azurro/QuizModal"
import { WordRotate } from "@/components/ui/word-rotate"
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal"
import {
  EASE,
  fadeIn,
  fadeUp,
  fadeUpTight,
  gridCell,
  livePulse,
  overlay,
  overlayContent,
  stagger,
  unbookedCell,
  viewportEarly,
  viewportOnce,
} from "@/components/azurro/motion"

/** How long the loader holds before the confirmation takes over. */
const LOADER_MS = 5000

// "ground" first — it's what's in the DOM on first paint, so screenshots
// and link previews show the same word the title/meta description use.
const HERO_ROTATING_WORDS = ["ground", "court", "turf", "slot"]

const primaryBtn =
  "inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-85"
const outlineBtn =
  "inline-flex items-center border border-border text-foreground text-[13px] transition-colors hover:bg-secondary"
const navLink =
  "relative inline-flex min-h-9 items-center px-3 text-muted-foreground transition-colors hover:text-foreground " +
  "after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 " +
  "after:bg-foreground after:transition-transform after:duration-300 " +
  "after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:after:scale-x-100 " +
  "motion-reduce:after:transition-none"
// scroll-mt clears the sticky header on anchor jumps; each section's own top
// padding supplies the breathing room below it. The header is one row at every
// width now (66px, +1 rounding at the narrowest), so this offset no longer
// has to step at `nav` the way it did when the header itself changed height.
const sectionPad =
  "mx-auto max-w-[1200px] px-6 pt-[clamp(56px,9vw,96px)] scroll-mt-[77px]"
// Below sm the terminal is narrower than its own longest line — whitespace-pre
// there puts the tail of every line (the POST and its status) behind a nested
// horizontal scroll. break-all wraps at the column the way a real narrow
// terminal does; Chrome breaks after a hyphen no matter what, so wrapping on
// word boundaries would split in-roi anyway, just with a ragged edge.
const termLine =
  "font-mono whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal " +
  "text-[clamp(11px,2.2cqw,12px)] leading-[1.72]"
const mobileNavLink =
  "flex min-h-11 items-center border-b border-border px-1 text-[15px] text-muted-foreground " +
  "transition-colors last:border-b-0 hover:text-foreground"
const tap = { scale: 0.985 }

const NAV_LINKS = [
  { href: "#what", label: "Scoresheets" },
  { href: "#var", label: "VAR-o1" },
  { href: "#faq", label: "FAQ" },
]

const TIMES = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]

const OCCUPANCY_ROWS: { label: string; cells: ("empty" | "booked")[] }[] = [
  {
    label: "GROUND 1",
    cells: ["empty", "booked", "booked", "booked", "empty", "empty"],
  },
  {
    label: "GROUND 2",
    cells: ["booked", "booked", "empty", "booked", "booked", "empty"],
  },
  {
    label: "GROUND 3",
    cells: ["empty", "booked", "booked", "empty", "empty", "empty"],
  },
  {
    label: "GROUND 4",
    cells: ["booked", "empty", "booked", "booked", "booked", "empty"],
  },
]

// The catch can only land where the register shows nothing — that is the whole
// claim. So the empty cells, and only those, are the candidate positions.
const CATCH_SLOTS = OCCUPANCY_ROWS.flatMap((row, r) =>
  row.cells.flatMap((cell, c) => (cell === "empty" ? [[r, c] as const] : []))
)
// Opens on GROUND 3 / 21:00, the position this grid was designed around.
const FIRST_CATCH = Math.max(
  CATCH_SLOTS.findIndex(([r, c]) => r === 2 && c === 4),
  0
)
const CATCH_INTERVAL = 3600

const VAR_ITEMS = [
  {
    title: "Unbooked play",
    desc: "Ground was occupied. Nothing in the register.",
  },
  {
    title: "Booking mismatch",
    desc: "Play registered against a different court.",
  },
  { title: "Overtime play", desc: "Game ran past the slot it was booked for." },
]

const CHECKLIST = [
  "Connect to your existing DVR",
  "Map every ground and slot",
  "Set up your grid and rates",
  "First report the next midnight",
]

const FAQS = [
  {
    q: "Can you use my existing cameras?",
    a: "Yes. We connect to the DVR you already have.",
  },
  {
    q: "Will my staff actually use it?",
    a: "A booking takes seconds to enter, faster than writing it down. The grid is the only screen they need.",
  },
  {
    q: "Who can see my footage?",
    a: "You and your team. Azurro reads occupancy from your cameras and keeps the frames tied to your findings. Nothing else leaves your centre.",
  },
]

export function AzurroLanding() {
  // MotionConfig strips transforms for reduced-motion users but leaves opacity
  // running, so the looping animations on the page need their own opt-out.
  const reduceMotion = useReducedMotion()

  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  // Quiz, loader and confirmation are one sequence, so they share a single
  // stage rather than three booleans that could contradict each other.
  const [stage, setStage] = useState<"idle" | "quiz" | "loader" | "thanks">(
    "idle"
  )

  const openQuiz = (e: React.MouseEvent) => {
    e.preventDefault()
    setStage("quiz")
  }

  useEffect(() => {
    if (stage !== "loader") return
    const timer = setTimeout(() => setStage("thanks"), LOADER_MS)
    return () => clearTimeout(timer)
  }, [stage])

  // The panel only exists below `nav`; resizing past it (rotating a tablet,
  // widening a window) must drop the open state too, or a hidden trigger
  // leaves stale "expanded" state on the desktop nav for a11y tools to trip on.
  useEffect(() => {
    const query = window.matchMedia(
      `(min-width: ${getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-nav")})`
    )
    const onChange = () => setMenuOpen(false)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  // VAR-o1 keeps finding a new one. The catch moves between empty slots while
  // the grid is on screen, and holds still once it scrolls away.
  const gridRef = useRef<HTMLDivElement>(null)
  const gridInView = useInView(gridRef as React.RefObject<Element>, {
    amount: 0.3,
  })
  const [catchIndex, setCatchIndex] = useState(FIRST_CATCH)
  const [catchRow, catchCol] = CATCH_SLOTS[catchIndex]

  useEffect(() => {
    if (reduceMotion || !gridInView || CATCH_SLOTS.length < 2) return
    const move = setInterval(() => {
      setCatchIndex((current) => {
        let next = current
        while (next === current) {
          next = Math.floor(Math.random() * CATCH_SLOTS.length)
        }
        return next
      })
    }, CATCH_INTERVAL)
    return () => clearInterval(move)
  }, [reduceMotion, gridInView])

  return (
    <MotionConfig reducedMotion="user">
      {/* overflow-x-clip, not -hidden: `hidden` computes overflow-y to `auto`,
          which makes this div the sticky header's scroll container and kills
          the stick. `clip` contains the rails without creating one. */}
      <div className="relative z-0 min-h-full overflow-x-clip bg-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[-1] opacity-40"
        >
          <div className="relative mx-auto h-full max-w-[1200px]">
            {/* The two rules draw down on load, so the page sets its own margins. */}
            <motion.div
              className="absolute inset-y-0 left-0 w-px origin-top bg-border"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-px origin-top bg-border"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            />
          </div>
        </div>

        {/* Header — opacity only; a transform here would fight position: sticky. */}
        <motion.div
          className="sticky top-0 z-30 border-b border-border bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="mx-auto flex max-w-[1200px] items-center gap-x-2 px-6 py-3 nav:gap-x-4">
            <div className="mr-auto flex items-center gap-[9px]">
              <span className="relative block h-7 w-5 overflow-hidden">
                <img
                  src={logo}
                  alt="Azurro"
                  className="absolute -top-[17px] -left-[21px] h-[62px] w-[62px]"
                />
              </span>
              <span className="font-display text-2xl leading-none font-bold tracking-[0.02em] text-foreground">
                AZURRO
              </span>
            </div>
            {/* Inline from `nav` up; below it these links live in the panel
                the hamburger opens, so this row is display:none there rather
                than just visually hidden. */}
            <div className="hidden items-center gap-1 text-[13px] nav:flex">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className={navLink}>
                  {link.label}
                </a>
              ))}
            </div>
            <motion.a
              href="#contact"
              onClick={openQuiz}
              whileTap={tap}
              className={`${outlineBtn} min-h-10 px-3 font-medium whitespace-nowrap nav:px-3.5`}
            >
              Book a Demo
            </motion.a>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-10 shrink-0 items-center justify-center border border-border text-foreground transition-colors hover:bg-secondary nav:hidden"
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.div
                id="mobile-nav"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
                className="overflow-hidden border-t border-border nav:hidden"
              >
                <nav className="mx-auto flex max-w-[1200px] flex-col px-6">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={mobileNavLink}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hero — above the fold, so it staggers on mount rather than on scroll. */}
        <motion.section
          className="mx-auto max-w-[1200px] px-6 pt-[clamp(48px,8vw,96px)]"
          variants={stagger(0.08, 0.15)}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 bg-secondary px-3 py-[5px] text-xs text-muted-foreground"
          >
            <span className="block h-[5px] w-[5px] bg-foreground" />
            Half a day to install. Live the next morning.
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mb-6 max-w-[19ch] text-[clamp(40px,7vw,88px)] leading-[0.92]"
          >
            Know exactly what happened at every{" "}
            <WordRotate words={HERO_ROTATING_WORDS} duration={2800} />{" "}
            today.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mb-8 max-w-[52ch] text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground"
          >
            Your staff record the bookings. Your cameras confirm them. You read
            one report at midnight.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-2"
          >
            <motion.a
              href="#contact"
              onClick={openQuiz}
              whileTap={tap}
              className={`${primaryBtn} min-h-11 px-[18px]`}
            >
              Book a Demo
            </motion.a>
            <motion.a
              href="https://app.azurro.co.in"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={tap}
              className={`${outlineBtn} min-h-11 px-3.5`}
            >
              Sign in
            </motion.a>
          </motion.div>
        </motion.section>

        {/* Occupancy grid mock */}
        <section className="mx-auto max-w-[1200px] px-6 pt-[clamp(40px,6vw,64px)]">
          <motion.div
            ref={gridRef}
            className="bg-card p-[clamp(16px,3vw,24px)] shadow-[inset_0_0_0_1px_var(--border)]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportEarly}
          >
            <div className="flex flex-wrap items-center gap-2 pb-4">
              <span className="font-mono text-xs text-muted-foreground">
                SCORESHEETS · 12 SEP · OCCUPANCY
              </span>
              <motion.span
                variants={reduceMotion ? fadeIn : livePulse}
                className="ml-auto inline-flex bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground"
              >
                LIVE
              </motion.span>
            </div>

            {/* Six slots will not fit a phone at a legible size, so the grid
                scrolls. min-w is the point where a cell still holds UNBOOKED
                (~56px) and the label column still holds "GROUND 1" — dropping
                it from 620px puts two more slots on screen at 360px. */}
            <div className="overflow-x-auto overscroll-x-contain">
              <motion.div
                className="grid min-w-[408px] gap-1 font-mono text-[11px] text-muted-foreground"
                style={{
                  gridTemplateColumns:
                    "clamp(72px, 20vw, 110px) repeat(6, minmax(0, 1fr))",
                }}
                variants={{ hidden: {}, visible: {} }}
              >
                <span />
                {TIMES.map((t, i) => (
                  <motion.span
                    key={t}
                    variants={gridCell}
                    custom={i}
                    className="pb-1"
                  >
                    {t}
                  </motion.span>
                ))}

                {OCCUPANCY_ROWS.map((row, r) => (
                  <Fragment key={row.label}>
                    <motion.span
                      variants={gridCell}
                      custom={0}
                      className="flex h-9 items-center"
                    >
                      {row.label}
                    </motion.span>
                    {row.cells.map((cell, i) => {
                      // The key carries the cell's state so a slot that gains or
                      // loses the catch remounts and replays its animation
                      // instead of silently swapping class names.
                      const isCatch = r === catchRow && i === catchCol
                      return isCatch ? (
                        <motion.div
                          key={`${i}-catch`}
                          variants={unbookedCell}
                          className="flex h-9 items-center justify-center bg-primary text-[10px] tracking-[0.04em] text-primary-foreground"
                        >
                          UNBOOKED
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`${i}-${cell}`}
                          variants={gridCell}
                          custom={i}
                          className={
                            cell === "booked"
                              ? "h-9 bg-secondary"
                              : "h-9 border border-border"
                          }
                        />
                      )
                    })}
                  </Fragment>
                ))}
              </motion.div>
            </div>
            {/* The grid only overflows below md, so the hint only shows there.
                A fade at the scroll edge was the alternative and it would hide
                the last slot at the end of the scroll — not acceptable on the
                one block that is meant to be read cell by cell. */}
            <p
              aria-hidden="true"
              className="pt-3 font-mono text-[10px] tracking-[0.04em] text-muted-foreground md:hidden"
            >
              SWIPE FOR LATER SLOTS →
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 font-mono text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="block h-3 w-3 bg-secondary" />
                BOOKED &amp; CONFIRMED
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="block h-3 w-3 border border-border" />
                EMPTY
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="block h-3 w-3 bg-primary" />
                PLAY WITH NO BOOKING
              </span>
            </div>
          </motion.div>
        </section>

        {/* What Azurro does */}
        <section id="what" className={sectionPad}>
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div
              variants={fadeUpTight}
              className="mb-5 font-mono text-xs text-muted-foreground"
            >
              01 / WHAT AZURRO DOES
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="mb-4 max-w-[19ch] text-[clamp(34px,5vw,64px)] leading-none"
            >
              You already have cameras. You already have a register. Azurro
              makes them agree.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mb-10 text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground"
            >
              You stop having to ask.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-2"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div
              variants={fadeUp}
              className="bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)]"
            >
              <div className="mb-5 inline-flex bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground">
                THE REGISTER
              </div>
              <h3 className="mb-3 text-[40px] leading-none">Scoresheets</h3>
              <p className="text-base leading-normal text-muted-foreground">
                Bookings, payments, credits, stock. Everything your centre takes
                in, entered as the day runs.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)]"
            >
              <div className="mb-5 inline-flex bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground">
                THE CHECK
              </div>
              <h3 className="mb-3 text-[40px] leading-none">VAR-o1</h3>
              <p className="text-base leading-normal text-muted-foreground">
                It watches the grounds and tells you what actually happened —
                not what was written down.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            id="var"
            className="mt-2 scroll-mt-[97px] bg-card shadow-[inset_0_0_0_1px_var(--border)]"
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {VAR_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUpTight}
                className={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-6 gap-y-2 px-6 py-5 ${
                  i < VAR_ITEMS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="block h-1.5 w-1.5 bg-foreground" />
                  <span className="text-[15px] font-medium text-foreground">
                    {item.title}
                  </span>
                </div>
                <p className="text-[15px] leading-[1.6] text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-[clamp(56px,9vw,96px)] flex flex-wrap items-center gap-[clamp(28px,4vw,56px)]"
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportEarly}
          >
            <motion.p
              variants={fadeUp}
              className="max-w-[460px] flex-[1_1_300px] text-[clamp(19px,2.2vw,24px)] leading-[1.35] text-foreground"
            >
              Every count comes with the run it came from. You see the ground,
              the time and what the cameras actually returned. So does your
              manager.
            </motion.p>
            {/* Terminal runs its own typing sequence off its own inView check;
                this wrapper only handles the reveal. */}
            <motion.div variants={fadeUp} className="flex-[1.4_1_420px]">
              <Terminal
                loop={!reduceMotion}
                loopDelay={5200}
                className="[container-type:inline-size] h-auto max-h-none w-full max-w-none rounded-none border-border bg-card [&>pre]:min-h-[calc(17.2em_+_40px)] [&>pre]:p-[clamp(10px,1.6cqw,20px)] [&>pre]:text-[clamp(11px,2.2cqw,12px)] [&>pre>code]:gap-y-0"
              >
                <AnimatedSpan
                  className={`${termLine} tracking-[0.04em] text-muted-foreground`}
                >
                  varo · terna-nerul
                </AnimatedSpan>
                <TypingAnimation
                  duration={26}
                  className={`${termLine} text-foreground`}
                >
                  {"> varo run --interval 15"}
                </TypingAnimation>
                <AnimatedSpan className={`${termLine} text-muted-foreground`}>
                  {"VAR-O1  0.2.0  yolo11m.pt conf=0.30 imgsz=640"}
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-muted-foreground`}>
                  {"centre  terna-nerul    cameras  9    interval  15s"}
                </AnimatedSpan>
                <AnimatedSpan
                  className={`${termLine} mt-[1.72em] text-green-500`}
                >
                  {
                    "  GR1   14:02:18  people=6  raw=8  in-roi=6   POST /ingest  200"
                  }
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-green-500`}>
                  {
                    "  GR2   14:02:18  people=0  raw=1  in-roi=0   POST /ingest  200"
                  }
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-green-500`}>
                  {
                    "  GR3   14:02:19  people=4  raw=4  in-roi=4   POST /ingest  200"
                  }
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-green-500`}>
                  {
                    "  PB3   14:02:19  people=0  raw=0  in-roi=0   POST /ingest  200"
                  }
                </AnimatedSpan>
                <TypingAnimation
                  duration={26}
                  className={`${termLine} mt-[1.72em] text-blue-500`}
                >
                  {"spool  0    last ingest  0.4s ago    box token  ok"}
                </TypingAnimation>
              </Terminal>
            </motion.div>
          </motion.div>
        </section>

        {/* Getting started */}
        <section className={sectionPad}>
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="visible"
            viewport={viewportEarly}
          >
            <motion.div
              variants={fadeUpTight}
              className="mb-5 font-mono text-xs text-muted-foreground"
            >
              02 / GETTING STARTED
            </motion.div>
            <div className="flex flex-wrap items-start gap-[clamp(28px,4vw,56px)]">
              <motion.div
                variants={fadeUp}
                className="max-w-[460px] flex-[1_1_300px]"
              >
                <h2 className="mb-5 text-[clamp(34px,5vw,64px)] leading-none">
                  Half a day per centre.
                </h2>
                <p className="mb-4 text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground">
                  We connect your existing cameras, map every ground and set up
                  your grid. Your staff keep working while we do it.
                </p>
                <p className="text-[clamp(17px,2vw,20px)] leading-[1.4] text-foreground">
                  You are live the next morning.
                </p>
              </motion.div>
              <motion.div
                variants={fadeUp}
                className="flex-[1.4_1_420px] bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)]"
              >
                <div className="mb-4 font-mono text-xs text-muted-foreground">
                  INSTALL CHECKLIST
                </div>
                <motion.div
                  variants={stagger(0.07)}
                  className="flex flex-col gap-3"
                >
                  {CHECKLIST.map((step, i) => (
                    <motion.div
                      key={step}
                      variants={fadeUpTight}
                      className="flex items-baseline gap-3"
                    >
                      <span className="font-mono text-xs text-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[15px]">{step}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section id="faq" className={sectionPad}>
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportEarly}
          >
            <motion.div
              variants={fadeUpTight}
              className="mb-5 font-mono text-xs text-muted-foreground"
            >
              03 / FAQ
            </motion.div>
            <div className="-mx-6 flex flex-col border-t border-border">
              {FAQS.map((faq) => (
                <motion.div
                  key={faq.q}
                  variants={fadeUpTight}
                  className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-[clamp(32px,5vw,64px)] gap-y-4 border-b border-border px-6 py-7"
                >
                  <h3 className="text-[clamp(26px,3vw,32px)] leading-[1.1]">
                    {faq.q}
                  </h3>
                  <p className="text-base leading-normal text-muted-foreground">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Contact */}
        <section id="contact" className={sectionPad}>
          <motion.div
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-[clamp(32px,5vw,64px)] bg-card px-[clamp(24px,4vw,48px)] py-[clamp(32px,5vw,64px)] shadow-[inset_0_0_0_1px_var(--border)]"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div variants={fadeUp}>
              <h2 className="mb-5 max-w-[14ch] text-[clamp(36px,5.4vw,72px)] leading-none">
                See it running on your centre.
              </h2>
              <p className="mb-3 max-w-[46ch] text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground">
                Tell us where you operate. We will show you what it would look
                like on your grounds.
              </p>
              <p className="max-w-[46ch] text-[15px] leading-[1.6] text-muted-foreground opacity-75">
                We will ask for your name, phone, business, city, and how many
                centres and grounds you run.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-start gap-3"
            >
              <motion.a
                href="mailto:hello@azurro.in?subject=Demo%20request"
                onClick={openQuiz}
                whileTap={tap}
                className={`${primaryBtn} min-h-12 w-full max-w-[360px] justify-center px-[18px]`}
              >
                Book a Demo
              </motion.a>
              <a
                href="mailto:hello@azurro.in"
                className="inline-flex min-h-9 items-center font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                hello@azurro.in
              </a>
            </motion.div>
          </motion.div>
        </section>

        <Footer />

        <QuizModal
          open={stage === "quiz"}
          onClose={() => setStage("idle")}
          onDone={() => setStage("loader")}
        />

        {/* mode="wait" holds the incoming state until the outgoing one has
            finished leaving, so the loader and the confirmation never overlap
            mid-fade. */}
        <AnimatePresence mode="wait">
          {stage === "loader" && (
            <motion.div
              key="loader"
              role="status"
              aria-label="Submitting"
              variants={overlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              // Pure black rather than --background (#0a0a0a): the animation
              // has black baked into its frames, and the 10/255 gap reads as a
              // visible square around it.
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
            >
              <motion.img
                variants={overlayContent}
                src={loaderAnimation}
                alt=""
                className="max-h-[20vh] w-auto max-w-full"
              />
            </motion.div>
          )}

          {stage === "thanks" && (
            <motion.div
              key="thanks"
              role="dialog"
              aria-modal="true"
              aria-label="Thanks"
              variants={overlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-6"
              onClick={() => setStage("idle")}
            >
              <motion.div
                variants={overlayContent}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm border border-border bg-background p-8 text-center"
              >
                <p className="text-xl leading-snug text-foreground">Got it.</p>
                <p className="mt-2 text-base leading-normal text-muted-foreground">
                  We'll call within one working day.
                </p>
                <button
                  type="button"
                  onClick={() => setStage("idle")}
                  className={`${primaryBtn} mt-6 justify-center px-[22px] py-[14px]`}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
