import Station from "./Station";
import Icon from "./Icon";
import { FEATURES } from "@/lib/data";

export default function Features() {
  return (
    <Station id="features" side="center">
      <div className="w-full">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="eyebrow">Platform Features</p>
          <h2
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Everything you need to <span className="text-grad">innovate</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">
            One platform that carries you from your first event to your first
            funded venture.
          </p>
        </div>

        <div className="reveal mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass group rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1.5"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `color-mix(in srgb, ${f.tint} 16%, white)`,
                  color: f.tint,
                }}
              >
                <Icon name={f.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Station>
  );
}
