/* ── Footer ──
   Simple site footer with brand name, tagline, and links. */
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark text-cream mt-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── Brand ── */}
          <div>
            <h3 className="text-lg tracking-wider font-semibold mb-2">
              Kallee Nepal
            </h3>
            <p className="text-sm text-cream/60">Handpicked Items for you.</p>
          </div>

          {/* ── Quick links ── */}
          <div>
            <h4 className="text-sm font-medium mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm text-cream/60">
              <Link
                to="/products"
                className="block hover:text-cream transition"
              >
                Products
              </Link>
              <Link
                to="/collections"
                className="block hover:text-cream transition"
              >
                Collection
              </Link>
              <Link
                to="/wishlist"
                className="block hover:text-cream transition"
              >
                Wishlist
              </Link>
              <Link to="/cart" className="block hover:text-cream transition">
                Cart
              </Link>
            </div>
          </div>

          {/* ── Contact ── */}
          <div>
            <h4 className="text-sm font-medium mb-3">Contact</h4>
            <p className="text-sm text-cream/60">
              hello@kalleenepal.com
              <br />
              +91 1800 123 456
            </p>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-8 pt-6 text-center text-xs text-cream/40">
          &copy; 2026 Kallee Nepal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
