import { Fragment } from "react"
import logo from "@/assets/azurro-logo.png"
import { AnimatedSpan, Terminal, TypingAnimation } from "@/components/ui/terminal"

const primaryBtn =
  "inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-85"
const outlineBtn =
  "inline-flex items-center border border-border text-foreground text-sm transition-colors hover:bg-secondary"
const navLink =
  "px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"

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
  return (
    <div className="relative z-0 min-h-full overflow-x-hidden bg-background pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[-1] opacity-40"
      >
        <div className="mx-auto grid h-full max-w-[1200px] grid-cols-4 border-r border-border px-6">
          <div className="border-l border-border" />
          <div className="border-l border-border" />
          <div className="border-l border-border" />
          <div className="border-l border-border" />
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
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
            <span className="font-display text-2xl leading-none tracking-[0.02em] text-foreground">
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
          <a href="#contact" className={`${outlineBtn} px-3.5 py-2 font-medium`}>
            Book a Demo
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pt-12 sm:pt-16 md:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 bg-secondary px-3 py-[5px] text-xs text-muted-foreground">
          <span className="block h-[5px] w-[5px] bg-foreground" />
          Half a day to install. Live the next morning.
        </div>
        <h1 className="mb-6 max-w-[19ch] text-[clamp(40px,7vw,88px)] leading-[0.92]">
          Know exactly what happened at every ground today.
        </h1>
        <p className="mb-8 max-w-[52ch] text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground">
          Your staff record the bookings. Your cameras confirm them. You read one
          report at midnight.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a href="#contact" className={`${primaryBtn} px-[18px] py-[11px]`}>
            Book a Demo
          </a>
          <a href="#what" className={`${outlineBtn} px-3.5 py-2.5 text-[13px]`}>
            See what it catches
          </a>
        </div>
      </section>

      {/* Occupancy grid mock */}
      <section className="mx-auto max-w-[1200px] px-6 pt-10 sm:pt-12 md:pt-16">
        <div className="bg-card p-4 shadow-[inset_0_0_0_1px_var(--border)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <span className="font-mono text-xs text-muted-foreground">
              SCORESHEETS · 12 SEP · OCCUPANCY
            </span>
            <span className="ml-auto inline-flex bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground">
              LIVE
            </span>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[620px] gap-1 font-mono text-[11px] text-muted-foreground"
              style={{ gridTemplateColumns: "110px repeat(6, 1fr)" }}
            >
              <span />
              {["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((t) => (
                <span key={t} className="pb-1">
                  {t}
                </span>
              ))}

              {OCCUPANCY_ROWS.map((row) => (
                <Fragment key={row.label}>
                  <span className="flex h-9 items-center">{row.label}</span>
                  {row.cells.map((cell, i) =>
                    cell === "unbooked" ? (
                      <div
                        key={i}
                        className="flex h-9 items-center justify-center bg-primary text-[10px] tracking-[0.04em] text-primary-foreground"
                      >
                        UNBOOKED
                      </div>
                    ) : cell === "booked" ? (
                      <div key={i} className="h-9 bg-secondary" />
                    ) : (
                      <div key={i} className="h-9 border border-border" />
                    )
                  )}
                </Fragment>
              ))}
            </div>
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
        </div>
      </section>

      {/* What Azurro does */}
      <section id="what" className="mx-auto max-w-[1200px] px-6 pt-14 sm:pt-20 md:pt-24">
        <div className="mb-5 font-mono text-xs text-muted-foreground">
          01 / WHAT AZURRO DOES
        </div>
        <h2 className="mb-4 max-w-[19ch] text-[clamp(34px,5vw,64px)] leading-none">
          You already have cameras. You already have a register. Azurro makes
          them agree.
        </h2>
        <p className="mb-10 text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground">
          You stop having to ask.
        </p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-2">
          <div className="bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)]">
            <div className="mb-5 inline-flex bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground">
              THE REGISTER
            </div>
            <h3 className="mb-3 text-[40px] leading-none">Scoresheets</h3>
            <p className="text-base leading-normal text-muted-foreground">
              Bookings, payments, credits, stock. Everything your centre takes
              in, entered as the day runs.
            </p>
          </div>
          <div className="bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)]">
            <div className="mb-5 inline-flex bg-secondary px-1.5 py-px font-mono text-xs text-muted-foreground">
              THE CHECK
            </div>
            <h3 className="mb-3 text-[40px] leading-none">VAR-o1</h3>
            <p className="text-base leading-normal text-muted-foreground">
              It watches the grounds and tells you what actually happened —
              not what was written down.
            </p>
          </div>
        </div>

        <div id="var" className="mt-2 bg-card shadow-[inset_0_0_0_1px_var(--border)]">
          {VAR_ITEMS.map((item, i) => (
            <div
              key={item.title}
              className={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-8 gap-y-2 px-6 py-5 ${
                i < VAR_ITEMS.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="block h-1.5 w-1.5 bg-foreground" />
                <span className="text-[15px] font-medium text-foreground">
                  {item.title}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-8 sm:mt-20 md:mt-24">
          <p className="flex-[1_1_260px] max-w-[420px] text-[clamp(19px,2.2vw,24px)] leading-[1.35] text-foreground">
            Every count comes with the run it came from. You see the ground,
            the time and what the cameras actually returned. So does your
            manager.
          </p>
          <div className="flex-[3_1_460px]">
            <Terminal className="h-auto max-h-none w-full max-w-none rounded-none border-border bg-card">
              <AnimatedSpan className="text-muted-foreground">
                <span className="ml-4 font-mono text-[11px] tracking-[0.04em]">
                  varo · terna-nerul
                </span>
              </AnimatedSpan>
              <TypingAnimation
                duration={26}
                className="font-mono text-xs text-foreground"
              >
                {"> varo run --interval 15"}
              </TypingAnimation>
              <AnimatedSpan className="font-mono text-xs text-muted-foreground">
                VAR-O1  0.2.0  yolo11m.pt conf=0.30 imgsz=640
              </AnimatedSpan>
              <AnimatedSpan className="font-mono text-xs text-muted-foreground">
                centre  terna-nerul    cameras  9    interval  15s
              </AnimatedSpan>
              <AnimatedSpan className="mt-2 font-mono text-xs text-green-500">
                {"  GR1   14:02:18  people=6  raw=8  in-roi=6   POST /ingest  200"}
              </AnimatedSpan>
              <AnimatedSpan className="font-mono text-xs text-green-500">
                {"  GR2   14:02:18  people=0  raw=1  in-roi=0   POST /ingest  200"}
              </AnimatedSpan>
              <AnimatedSpan className="font-mono text-xs text-green-500">
                {"  GR3   14:02:19  people=4  raw=4  in-roi=4   POST /ingest  200"}
              </AnimatedSpan>
              <AnimatedSpan className="font-mono text-xs text-green-500">
                {"  PB3   14:02:19  people=0  raw=0  in-roi=0   POST /ingest  200"}
              </AnimatedSpan>
              <TypingAnimation
                duration={26}
                className="mt-2 font-mono text-xs text-blue-500"
              >
                {"spool  0    last ingest  0.4s ago    box token  ok"}
              </TypingAnimation>
            </Terminal>
          </div>
        </div>
      </section>

      {/* Getting started */}
      <section className="mx-auto max-w-[1200px] px-6 pt-14 sm:pt-20 md:pt-24">
        <div className="mb-5 font-mono text-xs text-muted-foreground">
          02 / GETTING STARTED
        </div>
        <div className="flex flex-wrap items-start gap-8 sm:gap-12 md:gap-16">
          <div className="max-w-[420px] flex-[1_1_260px]">
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
          </div>
          <div className="flex-[3_1_460px] bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)]">
            <div className="mb-4 font-mono text-xs text-muted-foreground">
              INSTALL CHECKLIST
            </div>
            <div className="flex flex-col gap-3">
              {CHECKLIST.map((step, i) => (
                <div key={step} className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[1200px] px-6 pt-14 sm:pt-20 md:pt-24">
        <div className="mb-5 font-mono text-xs text-muted-foreground">03 / FAQ</div>
        <div className="flex flex-col border-t border-border">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-8 gap-y-4 border-b border-border py-7"
            >
              <h3 className="text-[clamp(26px,3vw,32px)] leading-[1.1]">
                {faq.q}
              </h3>
              <p className="text-base leading-normal text-muted-foreground">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-[1200px] px-6 pt-14 sm:pt-20 md:pt-24">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-8 bg-card p-6 shadow-[inset_0_0_0_1px_var(--border)] sm:gap-12 sm:p-10 md:gap-16 md:p-16">
          <div>
            <h2 className="mb-5 max-w-[14ch] text-[clamp(36px,5.4vw,72px)] leading-none">
              See it running on your centre.
            </h2>
            <p className="mb-3 max-w-[46ch] text-[clamp(17px,2vw,20px)] leading-[1.4] text-muted-foreground">
              Tell us where you operate. We will show you what it would look
              like on your grounds.
            </p>
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground opacity-75">
              We will ask for your name, phone, business, city, and how many
              centres and grounds you run.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <a
              href="mailto:hello@azurro.in?subject=Demo%20request"
              className={`${primaryBtn} w-full justify-center px-[18px] py-[13px]`}
            >
              Book a Demo
            </a>
            <a
              href="mailto:hello@azurro.in"
              className="font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              hello@azurro.in
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14 sm:pt-20 md:pt-24">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-6 text-[13px] text-muted-foreground">
          <span className="mr-auto">Azurro · Scoresheets · VAR-o1</span>
          <span>Navi Mumbai</span>
          <a
            href="mailto:hello@azurro.in"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            hello@azurro.in
          </a>
        </div>
      </div>
    </div>
  )
}
