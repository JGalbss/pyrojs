"use client"

import { useEffect, useRef, useState } from "react"
import { createFireworks, palettes, type FireworkType } from "@jgalbsss/pyrojs"

// A single grid cell that runs a looping mini-show of one firework type — but
// ONLY while it's on screen. An IntersectionObserver mounts/destroys the engine
// as the cell scrolls in and out of view, so a 68-cell grid keeps just a handful
// of engines alive at any moment.

const TYPE_COLORS: Partial<Record<FireworkType, ReadonlyArray<string>>> = {
  willow: palettes.gold,
  kamuro: palettes.gold,
  nishiki: palettes.gold,
  brocade: palettes.gold,
  comet: palettes.gold,
  coconut: palettes.gold,
  fountain: palettes.gold,
  conefountain: palettes.gold,
  horsetail: palettes.gold,
  waterfall: palettes.gold,
  tail: palettes.sunset,
  palm: palettes.ember,
  salute: palettes.hot,
  report: palettes.hot,
  flash: palettes.silver,
  firecracker: palettes.silver,
  strobe: palettes.silver,
  flitter: palettes.silver,
  sparkler: palettes.silver,
  ring: palettes.ice,
  saturn: palettes.ice,
  pearls: palettes.ice,
  spider: palettes.silver,
  crossette: palettes.neon,
  bees: palettes.neon,
  spinner: palettes.neon,
  pinwheel: palettes.neon,
  groundbloom: palettes.neon,
  fish: palettes.aurora,
  chrysanthemum: palettes.aurora,
  smoke: ["#9aa0aa", "#c2c7d0"],
  heart: ["#ff2d6b", "#ff7ad9", "#ffd1dc"],
}

const colorsFor = (type: FireworkType): ReadonlyArray<string> => TYPE_COLORS[type] ?? palettes.rainbow

export const FireworkCell = ({ type }: { type: FireworkType }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = wrapRef.current
    if (element === null) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry !== undefined) setVisible(entry.isIntersecting)
      },
      { rootMargin: "120px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (canvas === null) return
    const fw = createFireworks(canvas, {
      autoplay: false,
      background: "transparent",
      trail: 0.85,
      colors: [...colorsFor(type)],
    })
    const fire = (): void => fw.launch({ type, x: 0.5, y: 0.46, power: 1.15, rise: false })
    fire()
    const id = window.setInterval(fire, 1600)
    return () => {
      window.clearInterval(id)
      fw.destroy()
    }
  }, [visible, type])

  return (
    <div
      ref={wrapRef}
      className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/60 transition hover:border-white/30"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <span className="absolute bottom-1.5 left-0 right-0 text-center font-mono text-[11px] capitalize text-white/55 group-hover:text-white/90">
        {type}
      </span>
    </div>
  )
}
