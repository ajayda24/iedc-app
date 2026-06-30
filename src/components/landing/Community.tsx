import Station from "./Station";
import Icon from "./Icon";
import { COMMUNITY, STATS } from "@/lib/data";

export default function Community() {
  return (
    <Station id="community" side="center">
      <div className="w-full">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="eyebrow">Community Showcase</p>
          <h2
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Builders, in their <span className="text-grad">own words</span>
          </h2>
        </div>

        <div className="reveal mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {COMMUNITY.map((c) => (
            <figure key={c.name} className="glass flex flex-col rounded-3xl p-6">
              <div className="flex gap-1 text-peach">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" className="h-4 w-4" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-soft">
                &ldquo;{c.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full font-bold text-white"
                  style={{ background: c.tint }}
                >
                  {c.name.charAt(0)}
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-ink">{c.name}</div>
                  <div className="text-xs text-muted">{c.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* stat band */}
        <div className="reveal mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="glass-soft flex flex-col items-center rounded-2xl px-4 py-6 text-center"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${s.tint} 16%, white)`,
                  color: s.tint,
                }}
              >
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <div
                className="mt-3 text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.value}
              </div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Station>
  );
}
