import { Sparkles } from "lucide-react";
import type { ArtSpec } from "@/lib/types";

// Same gradient + grain language as ProductArt, minus the category icon —
// used for blog covers and homepage banners, which aren't tied to a
// product category.
export function EditorialArt({
  art,
  className,
  fill = false,
}: {
  art: ArtSpec;
  className?: string;
  /** Absolutely fills the nearest positioned ancestor instead of sitting
   * in normal flow — for stacking behind content (e.g. banner text)
   * rather than being the content itself (e.g. a blog cover image). */
  fill?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, ${art.from} 0%, ${art.to} 100%)`,
        position: fill ? "absolute" : "relative",
        overflow: "hidden",
        ...(fill ? { inset: 0 } : {}),
      }}
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.14]" style={{ color: art.accent }}>
        <defs>
          <pattern id="editorial-grain" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#editorial-grain)" />
      </svg>
      <Sparkles
        aria-hidden
        strokeWidth={0.75}
        className="absolute -bottom-6 -right-6 h-2/3 w-2/3 opacity-[0.16]"
        style={{ color: art.accent }}
      />
    </div>
  );
}
