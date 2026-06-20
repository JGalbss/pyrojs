import { useRef, useState } from "react"
import type { FireworksConfigInput, FireworksHandle, ImagePoint } from "@jgalbsss/pyrojs"
import { imageEffect, sampleImageData } from "@jgalbsss/pyrojs"
import { FireworksCanvas } from "../components/FireworksCanvas.js"
import { Hud } from "../components/Hud.js"
import { CodeBlock } from "../components/CodeBlock.js"

const demoConfig: FireworksConfigInput = {
  autoplay: false,
  background: "transparent",
  trail: 0.87,
}

const code = `import { createFireworks } from "@jgalbsss/pyrojs"

const fw = createFireworks(canvas)

// any image, SVG, data URI, or raw <svg> string
await fw.launchImage("/logo.svg", { x: 0.5, y: 0.5 })`

const textToPoints = (text: string): ReadonlyArray<ImagePoint> => {
  const canvas = document.createElement("canvas")
  canvas.width = 340
  canvas.height = 120
  const ctx = canvas.getContext("2d")
  if (ctx === null) return []
  const gradient = ctx.createLinearGradient(0, 0, 340, 0)
  gradient.addColorStop(0, "#ffd700")
  gradient.addColorStop(0.5, "#ff4da6")
  gradient.addColorStop(1, "#4dd2ff")
  ctx.fillStyle = gradient
  ctx.font = "bold 88px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, 170, 62)
  const { data } = ctx.getImageData(0, 0, 340, 120)
  return sampleImageData(data, 340, 120, { maxPoints: 540 })
}

export const ImageDemo = () => {
  const [text, setText] = useState("PYRO")
  const handleRef = useRef<FireworksHandle | null>(null)

  const fireworkify = (): void => {
    const handle = handleRef.current
    if (handle === null) return
    handle.clear()
    const points = textToPoints(text.length > 0 ? text : "🎆")
    handle.launchEffect(imageEffect(points), {
      x: 0.5,
      y: 0.55,
      count: points.length,
      power: 1.2,
      life: 2.4,
    })
  }

  return (
    <section id="fireworkify" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-bold sm:text-4xl">Fireworkify anything</h2>
      <p className="mt-2 max-w-2xl text-white/60">
        Images, SVGs, or text become fireworks — the break paints the picture. Type a word and
        watch it explode into existence.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={text}
              maxLength={8}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 font-mono text-lg outline-none focus:border-sky-400"
              placeholder="type a word"
            />
            <button
              onClick={fireworkify}
              className="shrink-0 rounded-xl bg-gradient-to-r from-amber-300 to-fuchsia-500 px-5 py-2.5 font-semibold text-black transition hover:opacity-90"
            >
              🎆 Fireworkify
            </button>
          </div>
          <CodeBlock code={code} title="ts" />
        </div>
        <div className="relative h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-black">
          <FireworksCanvas config={demoConfig} handleRef={handleRef} />
          <Hud handleRef={handleRef} />
        </div>
      </div>
    </section>
  )
}
