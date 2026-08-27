import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import logo from "@/assets/azurro-logo.png"
import { EASE } from "@/components/azurro/motion"
import { OTHER_CITY_LABEL, saveLead, type LeadAnswers } from "@/lib/lead"

type QuestionKey =
  | "centres"
  | "grounds"
  | "presence"
  | "records"
  | "pay"
  | "cctv"
  | "where"

type Answers = Partial<Record<QuestionKey, string>>

interface QuestionStep {
  key: QuestionKey
  q: string
  opts: string[]
}

const QSTEPS: QuestionStep[] = [
  {
    key: "centres",
    q: "How many centres do you run?",
    opts: ["1", "2 to 5", "6 to 15", "More than 15"],
  },
  {
    key: "grounds",
    q: "How many grounds/courts in total?",
    opts: ["Under 10", "10 to 25", "26 to 50", "More than 50"],
  },
  {
    key: "presence",
    q: "How often are you at your centres?",
    opts: [
      "Every day",
      "A few times a week",
      "Rarely",
      "Managers run them for me",
    ],
  },
  {
    key: "records",
    q: "How do you record bookings today?",
    opts: ["Notebook or register", "WhatsApp", "Excel", "Booking software"],
  },
  {
    key: "pay",
    q: "How do most customers pay?",
    opts: ["Mostly cash", "Cash and UPI about equal", "Mostly UPI or online"],
  },
  {
    key: "cctv",
    q: "Do your grounds/courts have CCTV already?",
    opts: ["Yes, all of them", "Some grounds", "No cameras yet"],
  },
  {
    key: "where",
    q: "Where do you operate?",
    opts: [
      "Navi Mumbai",
      "Mumbai",
      "Pune",
      "Bangalore",
      "Delhi NCR",
      "Other (enter city)",
    ],
  },
]

const PHRASE: Partial<Record<QuestionKey, Record<string, string>>> = {
  centres: {
    "1": "One centre",
    "2 to 5": "Two to five centres",
    "6 to 15": "Six to fifteen centres",
    "More than 15": "More than fifteen centres",
  },
  grounds: {
    "Under 10": "under ten grounds",
    "10 to 25": "ten to twenty-five grounds",
    "26 to 50": "twenty-six to fifty grounds",
    "More than 50": "more than fifty grounds",
  },
  pay: {
    "Mostly cash": "mostly cash",
    "Cash and UPI about equal": "cash and UPI about even",
    "Mostly UPI or online": "mostly digital",
  },
  presence: {
    "Every day": "you there every day",
    "A few times a week": "you there a few times a week",
    Rarely: "you rarely on site",
    "Managers run them for me": "managers running them",
  },
}

const TOTAL_STEPS = QSTEPS.length + 1

const pad2 = (n: number) => String(n).padStart(2, "0")

const quizInput =
  "border border-input bg-transparent px-4 py-[14px] font-sans text-base text-foreground " +
  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-1"
const quizPrimaryBtn =
  "inline-flex items-center bg-primary px-[22px] py-[14px] font-sans text-sm font-semibold " +
  "text-primary-foreground transition-opacity hover:opacity-85"
const quizGhostBtn =
  "border-0 bg-transparent py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"

interface QuizModalProps {
  open: boolean
  onClose: () => void
}

export function QuizModal({ open, onClose }: QuizModalProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [business, setBusiness] = useState("")
  const [why, setWhy] = useState("")
  const [hint, setHint] = useState("")
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherCity, setOtherCity] = useState("")

  // One id per visitor, generated once and kept in state. The route upserts on
  // it, so every step of this quiz updates a single row rather than adding one.
  const [sessionId] = useState(() => crypto.randomUUID())

  // Answers live in two places — the picked options in `answers`, the typed
  // contact details in their own fields — so saving needs both halves. Callers
  // pass the freshly-computed answers because setState has not applied yet.
  const withContact = (a: Answers, overrides: LeadAnswers = {}): LeadAnswers => ({
    ...a,
    otherCity,
    name,
    phone,
    business,
    why,
    ...overrides,
  })

  // Every "Book a Demo" click restarts the questions from the top — answers,
  // name, phone and business stay filled in behind the scenes, so a reopen
  // after Escape/CLOSE doesn't lose what was already typed.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(0)
      setHint("")
      setOtherOpen(false)
    }
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  const isQuestion = step < QSTEPS.length
  const isContact = step === QSTEPS.length
  const isDone = step > QSTEPS.length
  const cur = QSTEPS[step]
  const showBack = (step > 0 || otherOpen) && !isDone
  const progress = Math.round((Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100)
  const stepLabel = isDone
    ? "DONE"
    : `${pad2(Math.min(step + 1, TOTAL_STEPS))} / ${pad2(TOTAL_STEPS)}`
  const stepKicker = isContact
    ? "LAST STEP"
    : cur
      ? `QUESTION ${pad2(step + 1)}`
      : ""

  function pick(key: QuestionKey, label: string) {
    const next = { ...answers, [key]: label }
    setAnswers(next)
    setHint("")
    if (label === OTHER_CITY_LABEL) {
      // Nothing to save yet — the step has not advanced and the city is blank.
      setOtherOpen(true)
      return
    }
    setOtherOpen(false)
    setStep((s) => s + 1)
    saveLead(sessionId, step + 1, withContact(next))
  }

  function submitOther() {
    const city = otherCity.trim()
    if (!city) {
      setHint("Which city?")
      return
    }
    // `where` stays the picked option label so returning to this question still
    // shows it as PICKED; the typed city rides alongside it.
    setOtherCity(city)
    setOtherOpen(false)
    setStep((s) => s + 1)
    setHint("")
    saveLead(sessionId, step + 1, withContact(answers, { otherCity: city }))
  }

  function submitQuiz() {
    const trimmed = {
      name: name.trim(),
      phone: phone.trim(),
      business: business.trim(),
    }
    if (!trimmed.name || !trimmed.phone || !trimmed.business) {
      setHint("Name, phone and business name — all three, then we can call.")
      return
    }
    setStep((s) => s + 1)
    setHint("")
    // step + 1 lands on the final step, which is what marks the row complete.
    saveLead(sessionId, step + 1, withContact(answers, trimmed))
  }

  function back() {
    if (otherOpen) {
      setOtherOpen(false)
      setHint("")
      return
    }
    setStep((s) => Math.max(0, s - 1))
    setHint("")
  }

  const { summary, verdict, cctvNote } = useMemo(() => {
    const parts = (["centres", "grounds", "pay", "presence"] as const)
      .map((key) => {
        const value = answers[key]
        return value ? PHRASE[key]?.[value] : undefined
      })
      .filter((part): part is string => Boolean(part))
    const cashy =
      answers.pay === "Mostly cash" || answers.pay === "Cash and UPI about equal"
    const away = answers.presence === "Rarely"
    return {
      summary: parts.length ? `${parts.join(", ")}.` : "",
      verdict:
        cashy && away
          ? "That is the shape where we find the most."
          : answers.pay === "Mostly UPI or online"
            ? "You are mostly digital, so the gap we usually find is smaller. We would rather say that now than on the call."
            : "Worth a look. We will show you what your own grid would say.",
      cctvNote:
        answers.cctv === "No cameras yet"
          ? "No cameras yet, so we will price the install with them in it."
          : "We will use the cameras you already have.",
    }
  }, [answers])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Book a demo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background"
        >
          <div className="shrink-0 border-b border-border">
            <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-3">
              <div className="mr-auto flex items-center gap-[9px]">
                <span className="relative block h-7 w-5 overflow-hidden">
                  <img
                    src={logo}
                    alt="Azurro"
                    className="absolute -left-[21px] -top-[17px] h-[62px] w-[62px]"
                  />
                </span>
                <span className="font-display text-2xl leading-none font-bold tracking-[0.02em] text-foreground">
                  AZURRO
                </span>
              </div>
              <span className="hidden font-mono text-xs text-muted-foreground nav:inline">
                {stepLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="border border-border bg-transparent px-3 py-[7px] font-mono text-xs text-foreground transition-colors hover:bg-secondary"
              >
                CLOSE
              </button>
            </div>
          </div>

          <div className="h-0.5 shrink-0 bg-secondary">
            <motion.div
              className="h-0.5 bg-foreground"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-[1200px] px-6 py-[clamp(40px,7vw,88px)]">
              {isQuestion && cur && (
                <div>
                  <div className="mb-5 font-mono text-xs text-muted-foreground">
                    {stepKicker}
                  </div>
                  <h2 className="mb-10 max-w-[20ch] text-[clamp(34px,5vw,64px)] leading-none">
                    {cur.q}
                  </h2>
                  <div className="grid max-w-[900px] grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3">
                    {cur.opts.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => pick(cur.key, label)}
                        className="flex items-center gap-3 border border-border bg-transparent px-5 py-[18px] text-left font-sans text-base text-foreground transition-colors hover:bg-secondary"
                      >
                        <span>{label}</span>
                        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                          {answers[cur.key] === label ? "PICKED" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                  {otherOpen && (
                    <div className="mt-4 flex max-w-[900px] flex-wrap items-center gap-3">
                      <input
                        type="text"
                        placeholder="Which city?"
                        value={otherCity}
                        onChange={(e) => setOtherCity(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submitOther()}
                        className={`${quizInput} min-w-[240px] flex-1`}
                      />
                      <button
                        type="button"
                        onClick={submitOther}
                        className={quizPrimaryBtn}
                      >
                        Continue
                      </button>
                      {hint && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {hint}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isContact && (
                <div>
                  <div className="mb-5 font-mono text-xs text-muted-foreground">
                    {stepKicker}
                  </div>
                  <h2 className="mb-3 max-w-[20ch] text-[clamp(34px,5vw,64px)] leading-none">
                    Who do we call?
                  </h2>
                  <p className="mb-9 max-w-[46ch] text-base leading-normal text-muted-foreground">
                    Three fields. We call once, at a time you pick.
                  </p>
                  <div className="grid max-w-[900px] grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={quizInput}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={quizInput}
                    />
                    <input
                      type="text"
                      placeholder="Business name"
                      value={business}
                      onChange={(e) => setBusiness(e.target.value)}
                      className={quizInput}
                    />
                  </div>
                  <div className="mt-3 max-w-[900px]">
                    <input
                      type="text"
                      placeholder="What made you look at this today? (optional)"
                      value={why}
                      onChange={(e) => setWhy(e.target.value)}
                      className={`${quizInput} w-full`}
                    />
                  </div>
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={submitQuiz}
                      className={quizPrimaryBtn}
                    >
                      See what we would look at
                    </button>
                    {hint && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {hint}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isDone && (
                <div>
                  <div className="mb-5 font-mono text-xs text-muted-foreground">
                    WHAT YOU TOLD US
                  </div>
                  <h2 className="mb-7 max-w-[26ch] text-[clamp(30px,4.2vw,56px)] leading-[1.02]">
                    {summary}
                  </h2>
                  <div className="flex max-w-[620px] flex-col gap-3.5 border-t border-border pt-6">
                    <p className="text-[clamp(17px,2vw,20px)] leading-[1.4] text-foreground">
                      {verdict}
                    </p>
                    <p className="text-base leading-normal text-muted-foreground">
                      At Terna in Nerul we read nine cameras every fifteen
                      seconds. Their first audit landed the morning after
                      install. {cctvNote}
                    </p>
                    <p className="text-[15px] leading-[1.6] text-muted-foreground">
                      Next: a twenty-minute call on your own grid, within one
                      working day. Nothing to install before it.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={quizPrimaryBtn}
                    >
                      Done
                    </button>
                    <a
                      href="mailto:hello@azurro.in"
                      className="font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      hello@azurro.in
                    </a>
                  </div>
                </div>
              )}

              {showBack && (
                <button type="button" onClick={back} className={`${quizGhostBtn} mt-8`}>
                  ← BACK
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
