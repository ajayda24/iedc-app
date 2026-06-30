import TeamMarquee from "./TeamMarquee";

export default function Community() {
  return (
    <section
      id="team"
      data-station
      className="relative flex min-h-screen flex-col items-center justify-center gap-10 py-24"
    >
      <div className="reveal mx-auto max-w-2xl px-5 text-center sm:px-8">
        <p className="eyebrow">The People</p>
        <h2
          className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Meet the <span className="text-grad">IEDC Team</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          The students and mentor driving the innovation engine. Drag, swipe or
          just watch them roll by.
        </p>
      </div>

      <div className="reveal w-full">
        <TeamMarquee />
      </div>
    </section>
  );
}
