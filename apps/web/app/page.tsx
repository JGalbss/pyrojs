import { Hero } from "../components/Hero"
import { Grid } from "../components/Grid"
import { Fireworkify } from "../components/Fireworkify"

const REPO = "https://github.com/JGalbss/fireworks"

const Page = () => (
  <main className="relative overflow-x-hidden">
    <Hero />
    <Grid />
    <Fireworkify />
    <footer className="border-t border-white/10 px-6 py-12 text-center text-sm text-white/40">
      <p>
        Built with{" "}
        <a className="text-white/70 hover:text-white" href="https://effect.website">
          Effect
        </a>
        . MIT © JGalbss ·{" "}
        <a className="text-white/70 hover:text-white" href="/blog">
          how it works
        </a>{" "}
        ·{" "}
        <a className="text-white/70 hover:text-white" href={REPO}>
          github.com/JGalbss/fireworks
        </a>
      </p>
    </footer>
  </main>
)

export default Page
