import Station from "./Station";
import Icon from "./Icon";
import { JOURNEY } from "@/lib/data";

export default function AppJourney() {
  return (
    <Station id="journey" side="center">
      <div className="w-full">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="eyebrow">The App Journey</p>
          <h2
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            From sign-up to <span className="text-grad">startup</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">
            Follow the road. Every milestone unlocks the next.
          </p>
        </div>

        {/* progress track */}
        <div className="reveal mt-12">
          <div className="relative grid gap-5 md:grid-cols-5">
            {/* connecting line (desktop) */}
            <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-0.5 bg-gradient-to-r from-blue via-lavender to-indigo opacity-40 md:block" />
            {JOURNEY.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="glass flex h-full flex-col rounded-3xl p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl"
                      style={{
                        background: `color-mix(in srgb, ${s.tint} 16%, white)`,
                        color: s.tint,
                      }}
                    >
                      <Icon name={s.icon} className="h-6 w-6" />
                    </span>
                    <span
                      className="text-2xl font-extrabold opacity-30"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {s.n}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {s.desc}
                  </p>
                  {/* mini progress bar */}
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${((i + 1) / JOURNEY.length) * 100}%`,
                        background: `linear-gradient(90deg, ${s.tint}, color-mix(in srgb, ${s.tint} 40%, white))`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Station>
  );
}
