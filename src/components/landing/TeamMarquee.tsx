"use client";

import { useEffect, useRef, useState } from "react";
import { TEAM, type TeamMember } from "@/lib/data";

function Avatar({ member }: { member: TeamMember }) {
  const [broken, setBroken] = useState(false);
  const initials = member.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (broken || !member.profile_image) {
    return (
      <div
        className="grid h-full w-full place-items-center"
        style={{
          background: `linear-gradient(160deg, color-mix(in srgb, ${member.tint} 55%, white), color-mix(in srgb, ${member.tint} 22%, white))`,
        }}
      >
        <span
          className="text-5xl font-extrabold text-white/90"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={member.profile_image}
      alt={member.name}
      draggable={false}
      onError={() => setBroken(true)}
      className="h-full w-full select-none object-cover"
    />
  );
}

function Card({ member }: { member: TeamMember }) {
  return (
    <article
      className={`group relative h-[340px] w-[248px] shrink-0 overflow-hidden rounded-[26px] border transition-transform duration-300 will-change-transform hover:-translate-y-1.5 sm:h-[380px] sm:w-[272px] ${
        member.lead
          ? "border-transparent"
          : "border-white/70 bg-white/40 shadow-[0_24px_60px_-30px_rgba(40,52,92,0.5)]"
      }`}
      style={
        member.lead
          ? {
              background:
                "linear-gradient(140deg, var(--indigo), var(--sky)) border-box",
              boxShadow: "0 26px 70px -28px rgba(108,124,255,0.7)",
              padding: "3px",
            }
          : undefined
      }
    >
      <div
        className={`relative h-full w-full overflow-hidden ${
          member.lead ? "rounded-[23px]" : "rounded-[24px]"
        }`}
      >
        {/* photo */}
        <div className="absolute inset-0">
          <Avatar member={member} />
        </div>

        {/* gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1525]/85 via-[#0e1525]/15 to-transparent" />

        {/* lead badge */}
        {member.lead && (
          <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo backdrop-blur">
            ★ Faculty Lead
          </span>
        )}

        {/* tint accent line */}
        <span
          className="absolute bottom-[78px] left-5 h-1 w-10 rounded-full"
          style={{ background: member.tint }}
        />

        {/* name + position */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3
            className="text-lg font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {member.name}
          </h3>
          <p className="mt-0.5 text-sm text-white/75">{member.position}</p>
        </div>
      </div>
    </article>
  );
}

const GAP = 20; // px, must match the gap class below
const AUTO_SPEED_MOBILE = 0.65; // px per frame on touch devices
const AUTO_SPEED_DESKTOP = 0.85; // faster drift on desktop

export default function TeamMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const oneSet = setRef.current;
    if (!track || !oneSet) return;

    // touch devices keep the gentle speed; desktop drifts faster
    const isTouch = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;
    const speed = isTouch ? AUTO_SPEED_MOBILE : AUTO_SPEED_DESKTOP;

    let offset = 0;
    let setWidth = oneSet.scrollWidth + GAP;
    let pointerDown = false;
    let resumeAt = 0; // timestamp after which auto-scroll may resume
    let lastX = 0;
    let velocity = 0;
    let raf = 0;

    const measure = () => {
      setWidth = oneSet.scrollWidth + GAP;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(oneSet);

    const wrap = () => {
      if (setWidth <= 0) return;
      // keep offset within (-setWidth, 0] for a seamless loop
      while (offset <= -setWidth) offset += setWidth;
      while (offset > 0) offset -= setWidth;
    };

    const render = () => {
      track.style.transform = `translate3d(${offset}px,0,0)`;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (pointerDown) return;
      if (Math.abs(velocity) > 0.05) {
        offset += velocity;
        velocity *= 0.93; // momentum decay
      } else {
        velocity = 0;
        // resume auto-scroll only after the post-interaction delay
        if (now >= resumeAt) offset -= speed;
      }
      wrap();
      render();
    };
    raf = requestAnimationFrame(tick);

    const onDown = (e: PointerEvent) => {
      pointerDown = true;
      setDragging(true);
      lastX = e.clientX;
      velocity = 0;
      resumeAt = Infinity; // hold while interacting
      track.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!pointerDown) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      offset += dx;
      velocity = dx; // remember for inertia
      wrap();
      render();
    };
    const onUp = (e: PointerEvent) => {
      if (!pointerDown) return;
      pointerDown = false;
      setDragging(false);
      resumeAt = performance.now() + 1000; // autoplay again after 1s
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {}
    };

    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent sm:w-28" />

      <div
        ref={trackRef}
        className={`flex w-max gap-5 py-4 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "pan-y" }}
      >
        {/* first set (measured for the loop) */}
        <div ref={setRef} className="flex gap-5">
          {TEAM.map((m) => (
            <Card key={m.name} member={m} />
          ))}
        </div>
        {/* duplicate set for seamless infinite scroll */}
        <div className="flex gap-5" aria-hidden="true">
          {TEAM.map((m) => (
            <Card key={`dup-${m.name}`} member={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
