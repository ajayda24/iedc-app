"use client";

import { useEffect, useRef } from "react";
import { ROAD_W, ROAD_H, ROAD_PATH } from "@/lib/road";

const CAR_LINE = 0.6; // car sits at 60% of viewport height

export default function RoadJourney() {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const carRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const svg = svgRef.current;
    const car = carRef.current;
    if (!path || !svg || !car) return;

    let total = path.getTotalLength();
    // sample table mapping viewBox-y -> length (path descends monotonically)
    let samples: { y: number; len: number }[] = [];

    const buildSamples = () => {
      total = path.getTotalLength();
      const N = 700;
      samples = [];
      for (let i = 0; i <= N; i++) {
        const len = (i / N) * total;
        const pt = path.getPointAtLength(len);
        samples.push({ y: pt.y, len });
      }
    };

    const lenForY = (y: number) => {
      if (y <= samples[0].y) return samples[0].len;
      if (y >= samples[samples.length - 1].y)
        return samples[samples.length - 1].len;
      let lo = 0;
      let hi = samples.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].y < y) lo = mid;
        else hi = mid;
      }
      const a = samples[lo];
      const b = samples[hi];
      const t = (y - a.y) / (b.y - a.y || 1);
      return a.len + (b.len - a.len) * t;
    };

    buildSamples();

    const stations = Array.from(
      document.querySelectorAll<HTMLElement>("[data-station]")
    );

    let lastKey = -1;
    let raf = 0;
    let activeEl: HTMLElement | null = null;

    const update = () => {
      raf = requestAnimationFrame(update);

      const winH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const carScreenY = CAR_LINE * winH;
      const targetDocY = scrollY + carScreenY;

      const key = Math.round(targetDocY) + docH * 1e6;
      if (key === lastKey) return;
      lastKey = key;

      // map document-y -> viewBox-y (svg height == docH, preserveAspectRatio none)
      const yVb = (targetDocY / docH) * ROAD_H;
      const len = lenForY(yVb);

      const ctm = path.getScreenCTM();
      if (!ctm) return;

      const p1 = path.getPointAtLength(len);
      const p2 = path.getPointAtLength(Math.min(len + 3, total));

      const s1 = p1.matrixTransform(ctm);
      const s2 = p2.matrixTransform(ctm);

      const angle = (Math.atan2(s2.y - s1.y, s2.x - s1.x) * 180) / Math.PI + 90;

      car.style.transform = `translate(${s1.x}px, ${s1.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
      if (car.style.opacity !== "1") car.style.opacity = "1";

      // section highlight: whichever station straddles the car line
      let next: HTMLElement | null = null;
      for (const el of stations) {
        const r = el.getBoundingClientRect();
        if (r.top - 8 <= carScreenY && r.bottom + 8 >= carScreenY) {
          next = el;
          break;
        }
      }
      if (next !== activeEl) {
        activeEl?.classList.remove("is-active");
        next?.classList.add("is-active");
        activeEl = next;
      }
    };

    const onResize = () => {
      buildSamples();
      lastKey = -1;
    };

    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(update);

    // recompute once layout/fonts settle
    const t = setTimeout(onResize, 600);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      {/* Road layer — fills the full document height behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox={`0 0 ${ROAD_W} ${ROAD_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="asphalt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#333b4d" />
              <stop offset="0.5" stopColor="#272e3d" />
              <stop offset="1" stopColor="#1b2130" />
            </linearGradient>
            <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="roadShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="14"
                stdDeviation="26"
                floodColor="#5b6c8f"
                floodOpacity="0.28"
              />
            </filter>
          </defs>

          {/* soft ground glow under the road */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="#8aa0ff"
            strokeOpacity="0.1"
            strokeWidth="220"
            strokeLinecap="round"
          />
          {/* road body */}
          <path
            ref={pathRef}
            d={ROAD_PATH}
            fill="none"
            stroke="url(#asphalt)"
            strokeWidth="156"
            strokeLinecap="round"
            filter="url(#roadShadow)"
          />
          {/* left-edge sheen */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="url(#sheen)"
            strokeWidth="156"
            strokeLinecap="round"
          />
          {/* solid edge lines */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="#5a667e"
            strokeOpacity="0.5"
            strokeWidth="150"
            strokeLinecap="round"
            style={{ mixBlendMode: "screen" }}
          />
          {/* dashed center lane */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="#cdd6ee"
            strokeOpacity="0.85"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="34 46"
          />
        </svg>
      </div>

      {/* Car — fixed to the viewport, driven along the path on scroll */}
      <div
        ref={carRef}
        className="pointer-events-none fixed left-0 top-0 will-change-transform"
        style={{ opacity: 0, transition: "opacity .6s ease", zIndex: -5 }}
      >
        <div className="relative grid place-items-center">
          {/* headlight cone (points "up" = forward in local space) */}
          <div
            className="absolute bottom-1/2"
            style={{
              width: "150px",
              height: "260px",
              transform: "translateY(8px)",
              background:
                "radial-gradient(60% 90% at 50% 100%, rgba(255,239,191,0.85), rgba(255,225,150,0.35) 38%, rgba(255,225,150,0) 72%)",
              clipPath: "polygon(50% 100%, 8% 0%, 92% 0%)",
              filter: "blur(2px)",
              mixBlendMode: "screen",
            }}
          />
          {/* warm glow puddle on the road */}
          <div
            className="absolute"
            style={{
              width: "120px",
              height: "120px",
              transform: "translateY(-26px)",
              background:
                "radial-gradient(closest-side, rgba(255,233,170,0.55), rgba(255,233,170,0) 70%)",
              filter: "blur(3px)",
              mixBlendMode: "screen",
            }}
          />

          {/* the car (top-down, nose up) */}
          <svg
            width="60"
            height="104"
            viewBox="0 0 60 104"
            className="relative drop-shadow-[0_10px_18px_rgba(20,28,55,0.45)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#eef2fb" />
                <stop offset="0.5" stopColor="#cdd6ea" />
                <stop offset="1" stopColor="#aab6d2" />
              </linearGradient>
              <radialGradient id="hl" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#fff7da" />
                <stop offset="1" stopColor="#ffd86b" />
              </radialGradient>
            </defs>

            {/* body */}
            <rect
              x="9"
              y="6"
              width="42"
              height="92"
              rx="20"
              fill="url(#carBody)"
              stroke="#9aa7c6"
              strokeWidth="1"
            />
            {/* canopy / glass */}
            <rect
              x="15"
              y="26"
              width="30"
              height="46"
              rx="13"
              fill="#2c3550"
            />
            <rect
              x="17"
              y="20"
              width="26"
              height="16"
              rx="8"
              fill="#3b466a"
              opacity="0.85"
            />
            {/* headlights (front = top) */}
            <circle cx="18" cy="13" r="3.4" fill="url(#hl)" />
            <circle cx="42" cy="13" r="3.4" fill="url(#hl)" />
            {/* taillights (rear = bottom) */}
            <rect x="14" y="90" width="9" height="4" rx="2" fill="#ff5a5a" />
            <rect x="37" y="90" width="9" height="4" rx="2" fill="#ff5a5a" />
          </svg>
        </div>
      </div>
    </>
  );
}
