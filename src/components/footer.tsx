import { motion } from "motion/react"

import banner from "@/assets/azurro-banner.png"
import logo from "@/assets/azurro-logo.png"
import { GithubIcon } from "@/components/icons/github-icon"
import { XIcon } from "@/components/icons/x-icon"
import { Button } from "@/components/ui/button"
import { fadeIn, viewportEarly, viewportOnce } from "@/components/azurro/motion"

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
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Same cropped-logo treatment as the header, so the two marks
                  sit at identical optical weight. */}
              <div className="flex items-center gap-[9px]">
                <span className="relative block h-7 w-5 overflow-hidden">
                  <img
                    src={logo}
                    alt=""
                    className="absolute -top-[17px] -left-[21px] h-[62px] w-[62px]"
                  />
                </span>
                <span className="font-display text-2xl leading-none font-bold tracking-[0.02em] text-foreground">
                  AZURRO
                </span>
              </div>
              <div className="flex items-center">
                {socialLinks.map(({ href, label, icon }) => (
                  // size-11 over the icon size: ghost buttons have no visible
                  // box, so a 44px hit area costs nothing and clears the iOS
                  // minimum the rest of the page misses.
                  <Button
                    key={label}
                    size="icon"
                    variant="ghost"
                    className="size-11"
                    nativeButton={false}
                    render={<a aria-label={label} href={href} />}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <nav>
              <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-muted-foreground">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      className="py-1 transition-colors hover:text-foreground"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border py-4 text-[13px] text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Azurro · Navi Mumbai</p>
            <a
              className="font-mono transition-colors hover:text-foreground"
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
