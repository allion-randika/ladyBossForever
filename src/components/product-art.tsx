import { Shirt, Gem, Footprints, ShoppingBag, Sparkles } from "lucide-react";
import type { ArtSpec, Category } from "@/lib/types";

const ICONS: Record<Category, typeof Shirt> = {
  dresses: Shirt,
  tops: Shirt,
  denim: Shirt,
  trousers: Shirt,
  skirts: Shirt,
  jewelry: Gem,
  footwear: Footprints,
  bags: ShoppingBag,
  "hair-accessories": Sparkles,
};

export function ProductArt({
  art,
  category,
  className,
}: {
  art: ArtSpec;
  category: Category;
  className?: string;
}) {
  const Icon = ICONS[category];
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, ${art.from} 0%, ${art.to} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        style={{ color: art.accent }}
      >
        <defs>
          <pattern id="grain" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grain)" />
      </svg>
      <Icon
        aria-hidden
        strokeWidth={0.75}
        className="absolute -bottom-6 -right-6 h-2/3 w-2/3 opacity-[0.16]"
        style={{ color: art.accent }}
      />
    </div>
  );
}
