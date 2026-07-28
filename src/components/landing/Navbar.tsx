"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5 ${scrolled ? "bg-transparent " : "bg-transparent " //glass
          }`}
      >
        <a href="#top" className="flex items-end gap-2.5">
          <Image
            src="/logo-transparent.png"
            alt=""
            width={371}
            height={371}
            className="h-7 w-auto"
            priority
          />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HUB
          </span>
        </a>

        {/* <div className="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex">
          <a href="#about" className="transition-colors hover:text-ink">
            About
          </a>
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <a href="#team" className="transition-colors hover:text-ink">
            Team
          </a>
        </div> */}

        <Link href="/dashboard">
          <button className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
            Get Started
          </button>
        </Link>
      </nav>
    </header>
  );
}
