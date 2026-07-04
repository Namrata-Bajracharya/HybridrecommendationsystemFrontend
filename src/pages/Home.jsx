/* ── HomePage ──
   Entry page with hero section, "Recommended for You" (hybrid),
   "Trending Now" (popularity), occasion-based sections,
   "Recently Viewed" (session storage), and brand ethos. */
import { Link } from "react-router-dom";
import { useRecommendations } from "../context/RecommendationContext";
import { occasionLabels } from "../data/products";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const { forYou, trending, recentlyViewed, occasionEdits } =
    useRecommendations();

  return (
    <div>
      {/* ── Hero banner — full-bleed, no curves or padding ── */}
      <section className="bg-cream-alt text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl font-semibold text-dark mb-4 leading-tight">
            Timeless.
            <br />
            Handcrafted.
            <br />
            Yours.
          </h1>
          <p className="text-muted max-w-md mx-auto mb-6 text-sm">
            Discover ethnic wear that tells a story — from handloom sarees to
            hand-embroidered kurthas.
          </p>
          <Link
            to="/collections"
            className="inline-block px-8 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {/* ── Inner content container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Recommended for You ── */}
        {forYou.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-dark mb-6">
              Recommended for You
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {forYou.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Trending Now ── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-dark mb-6">Trending Now</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trending.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ── Occasion-based sections ── */}
        {occasionEdits
          .filter((o) => o.items.length > 0)
          .slice(0, 3)
          .map(({ occasion, items }) => (
            <section key={occasion} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-dark">
                  {occasionLabels[occasion]}
                </h2>
                <Link
                  to={`/products?occasion=${occasion}`}
                  className="text-sm text-accent hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-dark mb-6">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentlyViewed.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Ethos / Values ── */}
        <section className="bg-cream-alt p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            {
              emoji: "🧵",
              title: "Handloom & Handcrafted",
              desc: "Every piece supports traditional artisans across India.",
            },
            {
              emoji: "🌿",
              title: "Mindfully Sourced",
              desc: "Natural fabrics, ethical production, minimal waste.",
            },
            {
              emoji: "✨",
              title: "Curated for You",
              desc: "Smart recommendations based on your unique taste.",
            },
          ].map((item) => (
            <div key={item.title}>
              <div className="text-3xl mb-3">{item.emoji}</div>
              <h3 className="text-sm font-semibold text-dark mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
