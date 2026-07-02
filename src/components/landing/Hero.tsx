import Link from "next/link";
import Icon from "./Icon";

function StatChip({
  icon,
  value,
  label,
  tint,
  className = "",
}: {
  icon: string;
  value: string;
  label: string;
  tint: string;
  className?: string;
}) {
  return (
    <div
      className={`glass floaty flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${tint} 18%, white)`, color: tint }}
      >
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className="text-lg font-bold text-ink">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="top"
      data-station
      className="relative flex min-h-screen items-center py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 sm:px-8 md:grid-cols-1">
        {/* left: floating innovation cluster */}
        {/* <div className="relative hidden h-[460px] md:block">
          <div className="reveal absolute left-2 top-6">
            <StatChip
              icon="team"
              value="10K+"
              label="Students"
              tint="var(--blue)"
            />
          </div>
          <div className="reveal absolute bottom-10 left-0">
            <StatChip
              icon="trophy"
              value="500+"
              label="Events"
              tint="var(--peach)"
              className="slow"
            />
          </div>
          <div className="reveal absolute right-2 top-1/2">
            <StatChip
              icon="star"
              value="50+"
              label="Startups"
              tint="var(--mint)"
            />
          </div> */}
          {/* rocket badge */}
          {/* <div className="reveal floaty slow absolute right-10 top-2 grid h-20 w-20 place-items-center rounded-3xl glass">
            <Icon name="rocket" className="h-9 w-9 text-indigo" />
          </div>
        </div> */}

        {/* right: headline */}
        <div className="relative z-10 text-left">
          <p className="reveal eyebrow">Welcome to IEDC Hub</p>
          <h1
            className="reveal mt-4 text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Build.
            <br />
            <span className="text-grad">Innovate.</span>
            <br />
            Compete.
          </h1>
          <div className="reveal mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-indigo via-blue to-mint" />
          <p className="reveal mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
            Join Kerala&apos;s most active student innovation ecosystem.
            Participate in events, earn points, climb leaderboards, and build
            startups.
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
            <button className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
              Get Started
              <Icon name="arrow" className="h-4 w-4" />
            </button>
            </Link>
            <button className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
              <Icon name="play" className="h-4 w-4 text-indigo" />
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs font-medium text-muted">
        <div className="mx-auto mb-2 h-9 w-5 rounded-full border border-ink/15">
          <span className="mx-auto mt-1.5 block h-2 w-1 animate-bounce rounded-full bg-indigo" />
        </div>
        Scroll to begin the journey
      </div>
    </section>
  );
}
