import { useEffect, useRef, useState } from "react"
import type { FireworkType, FireworksConfigInput, FireworksHandle } from "pyrojs"
import { FIREWORK_TYPES } from "pyrojs"
import { FireworksCanvas } from "../components/FireworksCanvas.js"
import { Hud } from "../components/Hud.js"

const explorerConfig: FireworksConfigInput = {
  autoplay: false,
  background: "transparent",
  trail: 0.85,
  intensity: "energetic",
}

const tabClass = (active: boolean): string => {
  if (active) return "border-sky-400 bg-sky-400/15 text-white"
  return "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30"
}

export const TypeExplorer = () => {
  const [selected, setSelected] = useState<FireworkType>("peony")
  const handleRef = useRef<FireworksHandle | null>(null)

  useEffect(() => {
    const fire = (): void => {
      handleRef.current?.launch({
        type: selected,
        x: 0.2 + Math.random() * 0.6,
        y: 0.25 + Math.random() * 0.25,
        rise: true,
      })
    }
    fire()
    const id = window.setInterval(fire, 1100)
    return () => window.clearInterval(id)
  }, [selected])

  return (
    <section id="catalog" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-bold sm:text-4xl">18 firework types</h2>
      <p className="mt-2 max-w-2xl text-white/60">
        Each shell rises and breaks with its own physics signature. Click one to see it live.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black">
          <FireworksCanvas config={explorerConfig} handleRef={handleRef} />
          <Hud handleRef={handleRef} />
          <div className="pointer-events-none absolute bottom-3 right-4 font-mono text-sm capitalize text-white/70">
            {selected}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {FIREWORK_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className={`rounded-xl border px-3 py-3 text-sm capitalize transition ${tabClass(type === selected)}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
