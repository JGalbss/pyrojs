"use client"

import { useEffect, useRef, useState } from "react"
import { createFireworks, palettes } from "@jgalbsss/pyrojs"
import { Fireworks } from "@jgalbsss/pyrojs/react"

const REPO = "https://github.com/JGalbss/fireworks"

export const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const fw = createFireworks(canvas, {
      intensity: "energetic",
      colors: [...palettes.rainbow],
      trail: 0.86,
    })
    return () => fw.destroy()
  }, [])

  const celebrate = (): void => {
    setCelebrating(true)
    window.setTimeout(() => setCelebrating(false), 9000)
  }

  return (
    <header className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {celebrating && <Fireworks intensity="insane" colors={[...palettes.rainbow]} />}
      <div className="starfield absolute inset-0 opacity-60" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05060a]" />

      <div className="relative z-10 max-w-3xl">
        <h1 className="text-6xl font-black tracking-tight sm:text-8xl">
          pyro
          <span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
            js
          </span>
          <span className="ml-2">🎆</span>
        </h1>
        <p className="mt-5 text-lg text-white/70 sm:text-2xl">
          A fireworks engine for the web. Like react-confetti, but fireworks.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/45">
          68 firework types, image fireworkify, a one-line React overlay, and an Effect-TS
          choreography DSL. Tiny, fast, 100/100 on agent-doctor.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <code className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 font-mono text-sm text-emerald-300 backdrop-blur">
            npm i @jgalbsss/pyrojs
          </code>
          <button
            onClick={celebrate}
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
          <a
            href="/blog"
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-2 font-semibold text-white transition hover:bg-white/10"
          >
            How it works →
          </a>
        </div>
        <a href="#catalog" className="mt-10 inline-block text-sm text-white/40 hover:text-white/70">
          ↓ all 68 types, live
        </a>
      </div>
    </header>
  )
}
