import { motion } from "motion/react"

import banner from "@/assets/azurro-banner.png"
import { GithubIcon } from "@/components/icons/github-icon"
import { XIcon } from "@/components/icons/x-icon"
import { buttonVariants } from "@/components/ui/button"
import { fadeIn, viewportEarly, viewportOnce } from "@/components/azurro/motion"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "#what", label: "Scoresheets" },
  { href: "#var", label: "VAR-o1" },
  { href: "#faq", label: "FAQ" },
  { href: "#privacy", label: "Privacy" },
  { href: "#terms", label: "Terms" },
  { href: "#contact", label: "Contact us" },
]

// Placeholders until Azurro's handles exist — see the note in the summary.
const socialLinks = [
  { href: "#", label: "X", icon: <XIcon /> },
  { href: "#", label: "GitHub", icon: <GithubIcon /> },
]

export function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-[1200px] px-6 pt-[clamp(56px,9vw,96px)]">
        <motion.div
          className="-mx-6 border-t border-border px-6"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="flex flex-col gap-6 py-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center">
                {socialLinks.map(({ href, label, icon }) => (
                  // buttonVariants on a bare <a> rather than <Button>: these
                  // navigate, so they must stay links — Base UI's Button
                  // stamps role="button" on whatever it renders. size-11 over
                  // the icon size gives a 44px hit area, invisible on a ghost
                  // button and clearing the iOS minimum.
                  <a
                    key={label}
                    aria-label={label}
                    href={href}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-11"
                    )}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            <nav>
              <ul className="-my-1 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      className="inline-flex min-h-9 items-center transition-colors hover:text-foreground"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-[13px] text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Azurro · Koramangala, Bangalore
            </p>
            <a
              className="inline-flex min-h-9 items-center font-mono transition-colors hover:text-foreground"
              href="mailto:hello@azurro.in"
            >
              hello@azurro.in
            </a>
          </div>
        </motion.div>
      </div>

      {/* Wordmark banner, full-bleed past the 1200px container. Caps at its
          own intrinsic 1090px so it never upscales; width/height are the real
          pixel dimensions so it reserves its box before decode. */}
      <motion.div
        className="mt-[clamp(32px,5vw,56px)]"
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewportEarly}
      >
        <img
          src={banner}
          alt="Azurro"
          width={1090}
          height={377}
          className="mx-auto block h-auto w-full max-w-[1090px]"
        />
      </motion.div>
    </footer>
  )
}
