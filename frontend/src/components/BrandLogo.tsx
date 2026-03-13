import logo from "../assets/volcano-logo-v-shape.png";
import { cn } from "../utils/cn";

type Locale = "en" | "ar";

interface BrandLogoProps {
  locale?: Locale;
  compact?: boolean;
  withTagline?: boolean;
  className?: string;
}

export function BrandLogo({
  locale = "en",
  compact = false,
  withTagline = true,
  className,
}: BrandLogoProps) {
  const brandName = locale === "ar" ? "فولكانو" : "VOLCANO";
  const tagline = locale === "ar" ? "إكسسوارات وهدايا" : "ACCESSORIES AND GIFTS";

  return (
    <div
      className={cn(
        "flex items-center transition-all duration-300",
        compact ? "gap-3" : "gap-5",
        className
      )}
    >
      <img
        src={logo}
        alt="Volcano logo"
        className={cn(
          "object-contain transition-all duration-300",
          "drop-shadow-[0_0_28px_rgba(199,154,82,0.32)]",
          "hover:drop-shadow-[0_0_40px_rgba(199,154,82,0.5)]",
          "hover:scale-105",
          compact ? "h-14 w-auto sm:h-16" : "h-32 w-auto sm:h-40"
        )}
      />
      <div className={cn("space-y-0.5 transition-all duration-300", compact ? "space-y-0" : "space-y-1.5")}>
        <div
          className={cn(
            "font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)] transition-all duration-300",
            compact ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"
          )}
        >
          {brandName}
        </div>
        {withTagline ? (
          <p
            className={cn(
              "tracking-[0.26em] text-[#c89a51] transition-all duration-300",
              compact ? "text-[0.6rem] sm:text-[0.7rem]" : "text-[0.8rem] sm:text-[0.9rem]"
            )}
          >
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
