"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductArt } from "@/components/product-art";
import type { ArtSpec, Category } from "@/lib/types";

// Falls back to the generated placeholder art if the hotlinked stock photo
// fails to load (network hiccup, image pulled from Unsplash, offline dev) —
// the site should never show a broken-image icon.
export function ProductPhoto({
  src,
  art,
  category,
  alt,
  className,
  sizes,
}: {
  src: string;
  art: ArtSpec;
  category: Category;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <ProductArt art={art} category={category} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
      className={`object-cover ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  );
}
