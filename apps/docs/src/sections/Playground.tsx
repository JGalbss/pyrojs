import { useMemo, useRef, useState } from "react"
import type { FireworksConfigInput, FireworksHandle, Intensity } from "pyrojs"
import { INTENSITIES, palettes } from "pyrojs"
import { FireworksCanvas } from "../components/FireworksCanvas.js"
import { Hud } from "../components/Hud.js"
import { CodeBlock } from "../components/CodeBlock.js"

type PaletteName = keyof typeof palettes
const paletteNames = Object.keys(palettes) as ReadonlyArray<PaletteName>

const pillClass = (active: boolean): string => {
  if (active) return "bg-white text-black"
  return "bg-white/10 text-white/70 hover:bg-white/20"
}

const buildCode = (
  intensity: Intensity,
  palette: PaletteName,
  trail: number,
  gravity: number,
): string =>
  `import { Fireworks } from "pyrojs/react"
import { palettes } from "pyrojs"

<Fireworks
  intensity="${intensity}"
  colors={palettes.${palette}}
  trail={${trail.toFixed(2)}}
  gravity={${gravity}}
/>`

export const Playground = () => {
  const [intensity, setIntensity] = useState<Intensity>("energetic")
  const [palette, setPalette] = useState<PaletteName>("rainbow")
  const [trail, setTrail] = useState(0.82)
  const [gravity, setGravity] = useState(60)
  const handleRef = useRef<FireworksHandle | null>(null)

  const config: FireworksConfigInput = useMemo(
    () => ({
      intensity,
      colors: [...palettes[palette]],
      trail,
      gravity,
      background: "transparent",
    }),
    [intensity, palette, trail, gravity],
  )

  const code = useMemo(
    () => buildCode(intensity, palette, trail, gravity),
    [intensity, palette, trail, gravity],
  )

  return (
    <section id="playground" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-bold sm:text-4xl">Playground</h2>
      <p className="mt-2 max-w-2xl text-white/60">
        Tweak it live. Everything is validated by Effect <code>Schema</code> under the hood — the
        snippet updates as you go.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div>
            <div className="mb-2 text-sm font-medium text-white/70">Intensity</div>
            <div className="flex flex-wrap gap-2">
              {INTENSITIES.map((value) => (
                <button
                  key={value}
                  onClick={() => setIntensity(value)}
                  className={`rounded-full px-3 py-1.5 text-sm capitalize transition ${pillClass(value === intensity)}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-white/70">Palette</div>
            <div className="flex flex-wrap gap-2">
              {paletteNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setPalette(name)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm capitalize transition ${pillClass(name === palette)}`}
                >
                  <span className="flex">
                    {palettes[name].slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -4 }}
                      />
                    ))}
                  </span>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <div className="mb-1 flex justify-between text-sm font-medium text-white/70">
              <span>Trail</span>
              <span className="font-mono text-white/40">{trail.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.97}
              step={0.01}
              value={trail}
              onChange={(e) => setTrail(Number(e.target.value))}
              className="w-full accent-sky-400"
            />
          </label>

          <label className="block">
            <div className="mb-1 flex justify-between text-sm font-medium text-white/70">
              <span>Gravity</span>
              <span className="font-mono text-white/40">{gravity}</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={5}
              value={gravity}
              onChange={(e) => setGravity(Number(e.target.value))}
              className="w-full accent-sky-400"
            />
          </label>

          <button
            onClick={() => handleRef.current?.finale({ durationMs: 5000, shellsPerSecond: 12 })}
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-400 px-4 py-2.5 font-semibold text-black transition hover:opacity-90"
          >
            🎆 Fire a finale
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black">
            <FireworksCanvas config={config} handleRef={handleRef} />
            <Hud handleRef={handleRef} />
          </div>
          <CodeBlock code={code} title="react" />
        </div>
      </div>
    </section>
  )
}
