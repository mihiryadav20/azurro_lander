import { GithubIcon } from "@/components/icons/github-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const navLinks = [
	{ href: "#", label: "Features" },
	{ href: "#", label: "Blog" },
	{ href: "#", label: "About" },
	{ href: "#", label: "Contact" },
	{ href: "#", label: "Licence" },
	{ href: "#", label: "Privacy" },
];

const socialLinks = [
	{
		href: "#",
		label: "X",
		icon: <XIcon />,
	},
	{
		href: "#",
		label: "Github",
		icon: <GithubIcon />,
	},
];

export function Footer() {
	return (
		<footer className="mx-auto max-w-5xl *:px-4 *:md:px-6">
			<div className="flex flex-col gap-6 py-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Logo className="h-4.5" />
					</div>
					<div className="flex items-center">
						{socialLinks.map(({ href, label, icon }) => (
							<Button key={label} size="icon" variant="ghost" render={<a aria-label={label} href={href} />} nativeButton={false}>{icon}</Button>
						))}
					</div>
				</div>

				<nav>
					<ul className="flex flex-wrap gap-4 font-medium text-muted-foreground text-sm md:gap-6">
						{navLinks.map((link) => (
							<li key={link.label}>
								<a className="hover:text-foreground" href={link.href}>
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</div>

			<div className="flex items-center justify-between gap-4 border-t py-4 text-muted-foreground text-sm">
				<p>&copy; {new Date().getFullYear()} efferd</p>

				<p className="inline-flex items-center gap-1">
					<span>Built by</span>
					<a
						aria-label="x/twitter"
						className="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground hover:underline"
						href={"https://x.com/shabanhr"}
						rel="noreferrer"
						target="_blank"
					>
						<img
							alt="shaban"
							className="size-4 rounded-full"
							height="auto"
							src="https://github.com/shabanhr.png"
							width="auto"
						/>
						Shaban
					</a>
				</p>
			</div>
		</footer>
	);
}
