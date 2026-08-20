import type { ArtSpec } from "./types";

// Curated placeholder-art gradients, matching the brand palette. Real product
// photography replaces this entirely once it exists — until then, each
// product is deterministically assigned one of these so the same product
// always renders the same art, without the backend needing to store it.
const PALETTE: ArtSpec[] = [
  { from: "#4a1942", to: "#7c3a63", accent: "#f1e8e2" },
  { from: "#6d2340", to: "#b34e6f", accent: "#f1e8e2" },
  { from: "#1c1418", to: "#4a3540", accent: "#d9a9b4" },
  { from: "#3c4d68", to: "#6b7fa0", accent: "#f1e8e2" },
  { from: "#d9a9b4", to: "#b34e6f", accent: "#4a1942" },
  { from: "#3c4d68", to: "#232c3d", accent: "#c9a97c" },
  { from: "#7c7a52", to: "#585b3d", accent: "#f1e8e2" },
  { from: "#1c1418", to: "#3d2c33", accent: "#c9a97c" },
  { from: "#c9a97c", to: "#a85a3a", accent: "#f1e8e2" },
  { from: "#4a1942", to: "#2c0f28", accent: "#d9a9b4" },
  { from: "#3c4d68", to: "#556886", accent: "#f1e8e2" },
  { from: "#a3803f", to: "#6e5527", accent: "#f1e8e2" },
  { from: "#f1e8e2", to: "#c9a97c", accent: "#4a1942" },
  { from: "#6e5527", to: "#a3803f", accent: "#1c1418" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function artForProduct(id: string): ArtSpec {
  return PALETTE[hashString(id) % PALETTE.length];
}
