import Icon from "./Icon";

export default function CTA() {
  return (
    <>
      <section
        data-station
        className="relative flex min-h-screen items-center py-28"
      >
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
          <div className="reveal glass relative overflow-hidden rounded-[34px] px-8 py-16 text-center sm:px-14">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  "radial-gradient(600px 300px at 50% -10%, rgba(122,108,255,0.22), transparent 70%), radial-gradient(500px 300px at 90% 110%, rgba(95,227,192,0.2), transparent 70%)",
              }}
            />
            <span className="grid h-16 w-16 mx-auto place-items-center rounded-3xl bg-gradient-to-br from-indigo to-sky text-white shadow-[0_16px_30px_-10px_rgba(108,124,255,0.8)]">
              <Icon name="rocket" className="h-8 w-8" />
            </span>
            <h2
              className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your journey starts <span className="text-grad">here</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              The road is set, the headlights are on. Join thousands of student
              innovators building what&apos;s next.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button className="btn-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold">
                Get Started
                <Icon name="arrow" className="h-4 w-4" />
              </button>
              {/* <button className="btn-ghost rounded-xl px-7 py-3.5 text-sm font-semibold">
                Talk to the team
              </button> */}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-ink/5 px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo to-sky text-white">
              <Icon name="logo" className="h-5 w-5" />
            </span>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              IEDC Hub
            </span>
          </div>
          {/* <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-ink-soft">
            <a href="#about" className="hover:text-ink">About</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#journey" className="hover:text-ink">Journey</a>
            <a href="#team" className="hover:text-ink">Team</a>
          </div> */}
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} IEDC Hub. Build. Innovate. Compete.
          </p>
        </div>
      </footer>
    </>
  );
}
