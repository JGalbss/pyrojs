"use client"

import { useEffect, useRef, useState } from "react"
import { createFireworks, type FireworksHandle } from "@jgalbsss/pyrojs"

// Live image fireworkify: pick a logo (or paste any CORS-enabled image URL) and
// the break paints it. Bundled logos are same-origin so getImageData never taints.
const PRESETS: ReadonlyArray<{ label: string; url: string }> = [
  { label: "React", url: "/logos/react.svg" },
  { label: "GitHub", url: "/logos/github-icon.svg" },
  { label: "Google", url: "/logos/google.svg" },
  { label: "Spotify", url: "/logos/spotify.svg" },
  { label: "Chrome", url: "/logos/chrome.svg" },
]

export const Fireworkify = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<FireworksHandle | null>(null)
  const [url, setUrl] = useState("/logos/react.svg")

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const fw = createFireworks(canvas, { autoplay: false, background: "transparent", trail: 0.88 })
    handleRef.current = fw
    return () => {
      handleRef.current = null
      fw.destroy()
    }
  }, [])

  const fire = (target: string): void => {
    const handle = handleRef.current
    if (handle === null) return
    handle.clear()
    void handle
      .launchImage(target, { x: 0.5, y: 0.5, power: 1, life: 2.6, colors: 8 })
      .catch(() => undefined)
  }

  return (
    <section id="fireworkify" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold sm:text-4xl">Fireworkify any logo</h2>
      <p className="mt-2 max-w-2xl text-white/60">
        Hand it an image, SVG, or text. pyrojs rasterizes it, reduces it to a few dominant color
        layers with median-cut quantization, and the break paints the picture.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.url}
                onClick={() => {
                  setUrl(preset.url)
                  fire(preset.url)
                }}
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-sm transition hover:border-white/40"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 font-mono text-sm outline-none focus:border-sky-400"
              placeholder="/logos/react.svg or a CORS-enabled image URL"
            />
            <button
              onClick={() => fire(url)}
              className="shrink-0 rounded-xl bg-gradient-to-r from-amber-300 to-fuchsia-500 px-5 py-2.5 font-semibold text-black transition hover:opacity-90"
            >
              🎆 Fire
            </button>
          </div>
          <p className="text-xs text-white/40">
            Cross-origin images need permissive CORS headers; otherwise the canvas taints and
            sampling is blocked. The bundled logos are same-origin.
          </p>
        </div>
        <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-black">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    </section>
  )
}
