import { useRef } from "react"
import { Effect } from "effect"
import type { FireworksConfigInput, FireworksHandle } from "pyrojs"
import { palettes } from "pyrojs"
import {
  at,
  finale,
  fire,
  heart,
  peony,
  ring,
  runShow,
  salvo,
  timeline,
  willow,
} from "pyrojs/show"
import { FireworksCanvas } from "../components/FireworksCanvas.js"
import { Hud } from "../components/Hud.js"
import { CodeBlock } from "../components/CodeBlock.js"

const demoConfig: FireworksConfigInput = {
  autoplay: false,
  background: "transparent",
  trail: 0.85,
}

const demoShow = timeline(
  at("0s", salvo(3, peony({ colors: [...palettes.gold] }))),
  at("1.2s", fire(heart({ colors: ["#ff2d6b", "#ff7ad9"] }))),
  at("2.4s", salvo(4, willow())),
  at("3.6s", salvo(6, ring({ colors: [...palettes.ice] }))),
  at("5s", finale({ durationMs: 6000 })),
)

const showCode = `import { timeline, at, salvo, fire, finale } from "pyrojs/show"
import { peony, willow, heart, ring } from "pyrojs/show"

const show = timeline(
  at("0s",   salvo(3, peony({ colors: palettes.gold }))),
  at("1.2s", fire(heart({ colors: ["#ff2d6b"] }))),
  at("2.4s", salvo(4, willow())),
  at("3.6s", salvo(6, ring({ colors: palettes.ice }))),
  at("5s",   finale({ durationMs: 6000 })),
)

playShow(canvas, show) // compiles to a scheduled Effect program`

export const ShowDemo = () => {
  const handleRef = useRef<FireworksHandle | null>(null)

  const play = (): void => {
    const handle = handleRef.current
    if (handle === null) return
    handle.clear()
    Effect.runFork(runShow(handle.engine, demoShow))
  }

  return (
    <section id="show" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-bold sm:text-4xl">Choreograph a show</h2>
      <p className="mt-2 max-w-2xl text-white/60">
        <code>pyrojs/show</code> is a tiny declarative DSL that compiles to a scheduled Effect
        program — salvos, timelines, and finales with structured concurrency.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <CodeBlock code={showCode} title="show.ts" />
          <button
            onClick={play}
            className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-fuchsia-500 px-4 py-3 font-semibold text-black transition hover:opacity-90"
          >
            ▶ Play the show
          </button>
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black">
          <FireworksCanvas config={demoConfig} handleRef={handleRef} />
          <Hud handleRef={handleRef} />
        </div>
      </div>
    </section>
  )
}
