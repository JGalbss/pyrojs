import { FIREWORK_CATEGORIES } from "@jgalbsss/pyrojs"
import { FireworkCell } from "./FireworkCell"

// Server component: lays out every firework type, grouped by category. The cells
// themselves are client components that lazily run only while visible.
export const Grid = () => (
  <section id="catalog" className="mx-auto max-w-6xl px-6 py-20">
    <h2 className="text-3xl font-bold sm:text-4xl">Every firework, live</h2>
    <p className="mt-2 max-w-2xl text-white/60">
      All 68 types, each looping its own mini-show. Scroll through — cells fire only while on
      screen, so it stays smooth.
    </p>

    <div className="mt-10 space-y-12">
      {FIREWORK_CATEGORIES.map((category) => (
        <div key={category.name}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">{category.name}</h3>
            <p className="text-sm text-white/45">{category.blurb}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {category.types.map((type) => (
              <FireworkCell key={type} type={type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
)
