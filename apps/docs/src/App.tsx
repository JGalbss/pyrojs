import { useState } from "react"
import { Fireworks } from "@jgalbsss/pyrojs/react"
import { palettes } from "@jgalbsss/pyrojs"
import { FireworksCanvas } from "./components/FireworksCanvas.js"
import { CodeBlock } from "./components/CodeBlock.js"
import { Playground } from "./sections/Playground.js"
import { TypeExplorer } from "./sections/TypeExplorer.js"
import { ShowDemo } from "./sections/ShowDemo.js"
import { ImageDemo } from "./sections/ImageDemo.js"

const REPO = "https://github.com/JGalbss/fireworks"

export const App = () => {
  const [celebrating, setCelebrating] = useState(false)

  const celebrate = (): void => {
    setCelebrating(true)
    window.setTimeout(() => setCelebrating(false), 9000)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* react-confetti-style full-page overlay: fireworks burst over everything */}
      {celebrating && <Fireworks intensity="insane" colors={[...palettes.rainbow]} />}

      <Hero onCelebrate={celebrate} />
      <Quickstart />
      <Playground />
      <TypeExplorer />
      <ImageDemo />
      <ShowDemo />
      <Features />
      <Footer />
    </div>
  )
}

const Hero = ({ onCelebrate }: { onCelebrate: () => void }) => (
  <header className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
    <div className="starfield absolute inset-0 opacity-60" />
    <FireworksCanvas
      config={{ intensity: "energetic", colors: [...palettes.rainbow], trail: 0.86 }}
      style={{ position: "absolute", inset: 0 }}
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05060a]" />

    <div className="relative z-10 max-w-3xl">
      <h1 className="text-6xl font-black tracking-tight sm:text-8xl">
        pyro<span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">js</span>
        <span className="ml-2">🎆</span>
      </h1>
      <p className="mt-5 text-lg text-white/70 sm:text-2xl">
        A fireworks engine for the web. Like react-confetti, but fireworks.
      </p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-white/45">
        Tiny, fast, Effect-TS to the core. 68 firework types, a one-line React overlay, and a
        choreography DSL for building your own show.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <code className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 font-mono text-sm text-emerald-300 backdrop-blur">
          npm i pyrojs
        </code>
        <button
          onClick={onCelebrate}
          className="rounded-lg bg-gradient-to-r from-amber-300 to-fuchsia-500 px-5 py-2 font-semibold text-black transition hover:opacity-90"
        >
          🎆 Celebrate this page
        </button>
        <a
          href={REPO}
          className="rounded-lg border border-white/15 bg-white/5 px-5 py-2 font-semibold text-white transition hover:bg-white/10"
        >
          GitHub
        </a>
      </div>
      <a href="#playground" className="mt-10 inline-block text-sm text-white/40 hover:text-white/70">
        ↓ try the playground
      </a>
    </div>
  </header>
)

const tabs = {
  React: `import { Fireworks } from "@jgalbsss/pyrojs/react"

// One line. A full-screen overlay over your whole page.
export const App = () => <Fireworks intensity="energetic" />`,
  Vanilla: `import { createFireworks, palettes } from "@jgalbsss/pyrojs"

const fw = createFireworks(canvas, {
  intensity: "energetic",
  colors: palettes.gold,
})

fw.launch({ type: "willow", x: 0.5, y: 0.3 })
fw.finale({ durationMs: 8000 })`,
  Show: `import { timeline, at, salvo, peony, finale, playShow } from "@jgalbsss/pyrojs/show"

const show = timeline(
  at("0s", salvo(3, peony())),
  at("2s", finale({ durationMs: 6000 })),
)

playShow(canvas, show)`,
} as const

type TabName = keyof typeof tabs
const tabNames = Object.keys(tabs) as ReadonlyArray<TabName>

const tabButtonClass = (active: boolean): string => {
  if (active) return "bg-white text-black"
  return "text-white/60 hover:text-white"
}

const Quickstart = () => {
  const [tab, setTab] = useState<TabName>("React")
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold sm:text-4xl">Three ways to use it</h2>
      <div className="mt-6 flex justify-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {tabNames.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${tabButtonClass(name === tab)}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <CodeBlock code={tabs[tab]} title={tab.toLowerCase()} />
      </div>
    </section>
  )
}

const features = [
  {
    title: "Real fireworks",
    body: "Shells rise from the ground, arc, and break at apex into trailing stars that fall under gravity — not confetti appearing in place.",
  },
  {
    title: "Effect-TS to the core",
    body: "Schema-validated config, tagged error channels, a Scope-owned engine with forked fibers. Scores 100/100 on agent-doctor.",
  },
  {
    title: "Blazing fast",
    body: "Structure-of-Arrays typed-array engine. 50,000 particles step in ~0.8ms — the whole frame budget is left for the GPU.",
  },
  {
    title: "68 firework types",
    body: "Peony, willow, kamuro, crossette, pistil, spinner, multibreak, comet, pearls… plus shape bursts and image fireworkify.",
  },
  {
    title: "Deterministic",
    body: "Pass a seed and the show is byte-for-byte reproducible — perfect for tests and recordings.",
  },
  {
    title: "Tiny & typed",
    body: "ESM + CJS, full d.ts, tree-shakeable. react and effect are optional peers. One package, three entry points.",
  },
]

const Features = () => (
  <section className="mx-auto max-w-6xl px-6 py-24">
    <h2 className="text-3xl font-bold sm:text-4xl">Why pyrojs</h2>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25"
        >
          <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{feature.body}</p>
        </div>
      ))}
    </div>
  </section>
)

const Footer = () => (
  <footer className="border-t border-white/10 px-6 py-12 text-center text-sm text-white/40">
    <p>
      Built with{" "}
      <a className="text-white/70 hover:text-white" href="https://effect.website">
        Effect
      </a>
      . MIT © JGalbss.
    </p>
    <p className="mt-2">
      <a className="text-white/70 hover:text-white" href={REPO}>
        github.com/JGalbss/fireworks
      </a>
    </p>
  </footer>
)
