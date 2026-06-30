type Props = {
  name: string;
  className?: string;
};

const paths: Record<string, React.ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      <path d="M7.5 13h3M7.5 16.5h6" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10M17 5h3v1.5A3.5 3.5 0 0 1 17 10" />
      <path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14" r="5" />
      <path d="M12 12.4l.9 1.6 1.8.2-1.3 1.3.3 1.8L12 16.6l-1.7.7.3-1.8-1.3-1.3 1.8-.2.9-1.6Z" />
      <path d="M8.5 3.5 12 9l3.5-5.5" />
    </>
  ),
  certificate: (
    <>
      <rect x="3.5" y="4" width="17" height="12" rx="2.5" />
      <path d="M7 8h10M7 11h6" />
      <circle cx="12" cy="18.5" r="2.4" />
      <path d="M10.5 20.2 9.7 23l2.3-1.2 2.3 1.2-.8-2.8" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 3c3.4 1.6 5 4.6 5 8 0 2-.6 3.6-1.5 5h-7C7.6 14.6 7 13 7 11c0-3.4 1.6-6.4 5-8Z" />
      <circle cx="12" cy="10" r="1.8" />
      <path d="M9.5 16l-2 4 3.2-1.4M14.5 16l2 4-3.2-1.4" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.2c2.6.2 4.5 2.1 4.5 4.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 15l3-4 3 2 4-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.4 11l2.6 1-2.6 1L12 15.5 10.6 13 8 12l2.6-1L12 8.5Z" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  logo: (
    <>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="M12 7.5 8 9.75v4.5L12 16.5l4-2.25v-4.5L12 7.5Z" />
    </>
  ),
};

export default function Icon({ name, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={name === "star" || name === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? null}
    </svg>
  );
}
