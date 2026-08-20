import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-raised">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl text-plum">Lady Boss</p>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Fashion and accessories, shipped across Sri Lanka. This is a design preview running on placeholder data.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {["Instagram", "Facebook", "TikTok", "WhatsApp"].map((s) => (
                <Link
                  key={s}
                  href="#"
                  className="text-xs text-ink-soft underline underline-offset-4 hover:text-plum"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Shop</p>
            <ul className="mt-3 flex flex-col gap-2">
              {CATEGORIES.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop?category=${c.slug}`} className="text-sm text-ink-soft hover:text-plum">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Support</p>
            <ul className="mt-3 flex flex-col gap-2">
              <li><Link href="#" className="text-sm text-ink-soft hover:text-plum">Returns &amp; exchanges</Link></li>
              <li><Link href="#" className="text-sm text-ink-soft hover:text-plum">Shipping</Link></li>
              <li><Link href="#" className="text-sm text-ink-soft hover:text-plum">Privacy policy</Link></li>
              <li><Link href="#" className="text-sm text-ink-soft hover:text-plum">Terms</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Pay in installments</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Payzy", "Mintpay", "Koko"].map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-ink-soft"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-center text-xs text-ink-faint">
          &copy; {new Date().getFullYear()} Lady Boss Forever &mdash; design preview
        </div>
      </div>
    </footer>
  );
}
