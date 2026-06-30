type Props = {
  children: React.ReactNode;
  side?: "left" | "right" | "center";
  id?: string;
  className?: string;
};

export default function Station({
  children,
  side = "center",
  id,
  className = "",
}: Props) {
  const justify =
    side === "left"
      ? "md:justify-start"
      : side === "right"
        ? "md:justify-end"
        : "justify-center";

  return (
    <section
      id={id}
      data-station
      className={`relative flex min-h-screen items-center py-24 ${className}`}
    >
      <div
        className={`mx-auto flex w-full max-w-6xl justify-center px-5 sm:px-8 ${justify}`}
      >
        {children}
      </div>
    </section>
  );
}
