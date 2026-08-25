import { Sparkles } from "lucide-react";
import type { ArtSpec } from "@/lib/types";

// Same gradient + grain language as ProductArt, minus the category icon —
// used for blog covers and homepage banners, which aren't tied to a
// product category.
export function EditorialArt({ art, className }: { art: ArtSpec; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, ${art.from} 0%, ${art.to} 100%)`,
        position: "relative",
        overflow: "hidden",
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
