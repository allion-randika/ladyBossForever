"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { ProductArt } from "@/components/product-art";

// Stock editorial portrait standing in for a real campaign shot until the
// business has its own hero photography — same reasoning as the category
// photos in lib/product-photos.ts.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=1200&q=80";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20 lg:px-8">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="text-xs font-semibold uppercase tracking-wider text-rose"
          >
            New season, new drop
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="mt-3 text-balance font-display text-4xl leading-[1.05] text-ink sm:text-5xl lg:text-6xl"
          >
            Dress like you run the room.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease }}
            className="mt-5 max-w-md text-ink-soft"
          >
            Everyday fashion and accessories for women in Sri Lanka &mdash; new arrivals every
            week, installments on every order.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/shop"
              className="rounded-full bg-plum px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-plum-deep"
            >
              Shop new arrivals
            </Link>
            <Link
              href="/shop?category=dresses"
              className="rounded-full border border-line-strong px-7 py-3 text-sm font-medium text-ink transition-colors hover:border-plum hover:text-plum"
            >
              Explore dresses
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.7rem] font-medium uppercase tracking-wider text-ink-faint"
          >
            <span>Pay with</span>
            {["Payzy", "Mintpay", "Koko"].map((p) => (
              <span key={p} className="text-ink-soft">
                {p}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:aspect-square"
        >
          {photoFailed ? (
            <ProductArt
              art={{ from: "#4a1942", to: "#b34e6f", accent: "#f1e8e2" }}
              category="dresses"
              className="h-full w-full"
            />
          ) : (
            <Image
              src={HERO_PHOTO}
              alt="Lady Boss Forever — new season arrivals"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              onError={() => setPhotoFailed(true)}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
