import { Fragment } from "react"
import { MotionConfig, motion, useReducedMotion } from "motion/react"
import logo from "@/assets/azurro-logo.png"
import { AnimatedSpan, Terminal, TypingAnimation } from "@/components/ui/terminal"
import {
  EASE,
  fadeIn,
  fadeUp,
  fadeUpTight,
  gridCell,
  livePulse,
  stagger,
  unbookedCell,
  viewportEarly,
  viewportOnce,
} from "@/components/azurro/motion"

const primaryBtn =
  "inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-85"
const outlineBtn =
  "inline-flex items-center border border-border text-foreground text-[13px] transition-colors hover:bg-secondary"
const navLink =
  "px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
const sectionPad = "mx-auto max-w-[1200px] px-6 pt-[clamp(56px,9vw,96px)]"
const termLine =
  "font-mono whitespace-pre text-[clamp(11px,2.2cqw,12px)] leading-[1.72]"
const tap = { scale: 0.985 }

const TIMES = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"]

const OCCUPANCY_ROWS: { label: string; cells: ("empty" | "booked" | "unbooked")[] }[] = [
  { label: "GROUND 1", cells: ["empty", "booked", "booked", "booked", "empty", "empty"] },
  { label: "GROUND 2", cells: ["booked", "booked", "empty", "booked", "booked", "empty"] },
  { label: "GROUND 3", cells: ["empty", "booked", "booked", "empty", "unbooked", "empty"] },
  { label: "GROUND 4", cells: ["booked", "empty", "booked", "booked", "booked", "empty"] },
]

const VAR_ITEMS = [
  { title: "Unbooked play", desc: "Ground was occupied. Nothing in the register." },
  { title: "Booking mismatch", desc: "Play registered against a different court." },
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
  // running, so the one infinite animation on the page needs its own opt-out.
  const reduceMotion = useReducedMotion()

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative z-0 min-h-full overflow-x-hidden bg-background pb-24">
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
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-6 py-3">
            <div className="mr-auto flex items-center gap-[9px]">
              <span
                className="relative block h-7 w-[22px] overflow-hidden"
                style={{ mixBlendMode: "lighten" }}
              >
                <img
                  src={logo}
                  alt="Azurro"
                  className="absolute -left-[19px] -top-[17px] h-[60px] w-[60px]"
                />
              </span>
              <span className="font-display text-2xl leading-none font-bold tracking-[0.02em] text-foreground">
                AZURRO
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[13px]">
              <a href="#what" className={navLink}>
                Scoresheets
              </a>
              <a href="#var" className={navLink}>
                VAR-o1
              </a>
              <a href="#faq" className={navLink}>
                FAQ
              </a>
            </div>
            <motion.a
              href="#contact"
              whileTap={tap}
              className={`${outlineBtn} px-3.5 py-2 font-medium`}
            >
              Book a Demo
            </motion.a>
          </div>
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
            Know exactly what happened at every ground today.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mb-8 max-w-[52ch] text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground"
          >
            Your staff record the bookings. Your cameras confirm them. You read one
            report at midnight.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
            <motion.a
              href="#contact"
              whileTap={tap}
              className={`${primaryBtn} px-[18px] py-[11px]`}
            >
              Book a Demo
            </motion.a>
            <motion.a
              href="#what"
              whileTap={tap}
              className={`${outlineBtn} px-3.5 py-2.5`}
            >
              See what it catches
            </motion.a>
          </motion.div>
        </motion.section>

        {/* Occupancy grid mock */}
        <section className="mx-auto max-w-[1200px] px-6 pt-[clamp(40px,6vw,64px)]">
          <motion.div
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

            <div className="overflow-x-auto">
              <motion.div
                className="grid min-w-[620px] gap-1 font-mono text-[11px] text-muted-foreground"
                style={{ gridTemplateColumns: "110px repeat(6, 1fr)" }}
                variants={{ hidden: {}, visible: {} }}
              >
                <span />
                {TIMES.map((t, i) => (
                  <motion.span key={t} variants={gridCell} custom={i} className="pb-1">
                    {t}
                  </motion.span>
                ))}

                {OCCUPANCY_ROWS.map((row) => (
                  <Fragment key={row.label}>
                    <motion.span
                      variants={gridCell}
                      custom={0}
                      className="flex h-9 items-center"
                    >
                      {row.label}
                    </motion.span>
                    {row.cells.map((cell, i) =>
                      cell === "unbooked" ? (
                        <motion.div
                          key={i}
                          variants={unbookedCell}
                          className="flex h-9 items-center justify-center bg-primary text-[10px] tracking-[0.04em] text-primary-foreground"
                        >
                          UNBOOKED
                        </motion.div>
                      ) : cell === "booked" ? (
                        <motion.div
                          key={i}
                          variants={gridCell}
                          custom={i}
                          className="h-9 bg-secondary"
                        />
                      ) : (
                        <motion.div
                          key={i}
                          variants={gridCell}
                          custom={i}
                          className="h-9 border border-border"
                        />
                      )
                    )}
                  </Fragment>
                ))}
              </motion.div>
            </div>
            <div className="flex flex-wrap items-center gap-5 pt-4 font-mono text-[11px] text-muted-foreground">
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
              You already have cameras. You already have a register. Azurro makes
              them agree.
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
            className="mt-2 bg-card shadow-[inset_0_0_0_1px_var(--border)]"
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
              <Terminal className="h-auto max-h-none w-full max-w-none rounded-none border-border bg-card [container-type:inline-size] [&>pre]:min-h-[calc(17.2em_+_40px)] [&>pre]:p-[clamp(10px,1.6cqw,20px)] [&>pre]:text-[clamp(11px,2.2cqw,12px)] [&>pre>code]:gap-y-0">
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
                <AnimatedSpan className={`${termLine} mt-[1.72em] text-green-500`}>
                  {"  GR1   14:02:18  people=6  raw=8  in-roi=6   POST /ingest  200"}
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-green-500`}>
                  {"  GR2   14:02:18  people=0  raw=1  in-roi=0   POST /ingest  200"}
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-green-500`}>
                  {"  GR3   14:02:19  people=4  raw=4  in-roi=4   POST /ingest  200"}
                </AnimatedSpan>
                <AnimatedSpan className={`${termLine} text-green-500`}>
                  {"  PB3   14:02:19  people=0  raw=0  in-roi=0   POST /ingest  200"}
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
              <motion.div variants={fadeUp} className="max-w-[460px] flex-[1_1_300px]">
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
                <motion.div variants={stagger(0.07)} className="flex flex-col gap-3">
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
            <motion.div variants={fadeUp} className="flex flex-col items-start gap-3">
              <motion.a
                href="mailto:hello@azurro.in?subject=Demo%20request"
                whileTap={tap}
                className={`${primaryBtn} w-full justify-center px-[18px] py-[13px]`}
              >
                Book a Demo
              </motion.a>
              <a
                href="mailto:hello@azurro.in"
                className="font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                hello@azurro.in
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Footer */}
        <div className={sectionPad}>
          <motion.div
            className="-mx-6 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border px-6 pt-6 text-[13px] text-muted-foreground"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <span className="mr-auto">Azurro · Scoresheets · VAR-o1</span>
            <span>Navi Mumbai</span>
            <a
              href="mailto:hello@azurro.in"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              hello@azurro.in
            </a>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  )
}
