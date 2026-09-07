"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CATEGORIES } from "@/lib/categories";
import { ProductPhoto } from "@/components/product-photo";
import { photoForCategory } from "@/lib/product-photos";
import type { ArtSpec } from "@/lib/types";

const TILE_ART: Record<string, ArtSpec> = {
  dresses: { from: "#4a1942", to: "#7c3a63", accent: "#f1e8e2" },
  tops: { from: "#1c1418", to: "#4a3540", accent: "#d9a9b4" },
  denim: { from: "#3c4d68", to: "#232c3d", accent: "#c9a97c" },
  trousers: { from: "#1c1418", to: "#3d2c33", accent: "#c9a97c" },
  skirts: { from: "#6d2340", to: "#b34e6f", accent: "#f1e8e2" },
  jewelry: { from: "#a3803f", to: "#6e5527", accent: "#f1e8e2" },
  footwear: { from: "#c9a97c", to: "#a85a3a", accent: "#1c1418" },
  bags: { from: "#4a1942", to: "#2c0f28", accent: "#d9a9b4" },
  "hair-accessories": { from: "#d9a9b4", to: "#4a1942", accent: "#f1e8e2" },
};

export function CategoryTiles() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CATEGORIES.map((c) => (
        <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group block">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square overflow-hidden rounded-xl"
          >
            <ProductPhoto
              src={photoForCategory(c.slug)}
              art={TILE_ART[c.slug]}
              category={c.slug}
              alt={c.label}
              className="h-full w-full"
              sizes="(min-width: 1024px) 20vw, 33vw"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/45 via-black/0 to-black/0 p-3">
              <p className="font-display text-base text-white">{c.label}</p>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-white/75">{c.blurb}</p>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
