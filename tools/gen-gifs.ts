import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import { Effect } from "effect"
import { Simulation } from "../packages/pyrojs/src/engine/simulation.js"
import { decodeFireworksConfig } from "../packages/pyrojs/src/core/config.js"
import { palettes } from "../packages/pyrojs/src/engine/palettes.js"
import { imageEffect, sampleImageData } from "../packages/pyrojs/src/engine/image.js"
import type { FireworkEffect } from "../packages/pyrojs/src/engine/emitter.js"

import * as gifencNamespace from "gifenc"
const gifenc = (gifencNamespace as { default?: unknown }).default ?? gifencNamespace
const { GIFEncoder, quantize, applyPalette } = gifenc as {
  GIFEncoder: () => {
    writeFrame: (index: unknown, w: number, h: number, opts: unknown) => void
    finish: () => void
    bytes: () => Uint8Array
  }
  quantize: (data: unknown, count: number) => unknown
  applyPalette: (data: unknown, palette: unknown) => unknown
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ASSETS = resolve(ROOT, "assets")
const BG = "#05060a"
type Ctx = CanvasRenderingContext2D
type SurfaceArg = ConstructorParameters<typeof Simulation>[3]

interface GifOptions {
  readonly name: string
  readonly width: number
  readonly height: number
  readonly frames: number
  readonly fps: number
  readonly config?: Record<string, unknown>
  readonly drive: (sim: Simulation, frame: number) => void
}

const makeSim = (
  width: number,
  height: number,
  config: Record<string, unknown>,
): { sim: Simulation; ctx: Ctx } => {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d") as unknown as Ctx
  const surfaceFactory = ((size: number) => createCanvas(size, size)) as unknown as SurfaceArg
  const resolved = Effect.runSync(
    decodeFireworksConfig({ autoplay: false, background: BG, trail: 0.85, seed: 1337, ...config }),
  )
  const sim = new Simulation(ctx, resolved, resolved.seed ?? 1337, surfaceFactory)
  sim.resize(width, height, 1)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)
  return { sim, ctx }
}

const renderGif = (options: GifOptions): void => {
  const { name, width, height, frames, fps } = options
  const { sim, ctx } = makeSim(width, height, options.config ?? {})
  const gif = GIFEncoder()
  const delay = Math.round(1000 / fps)
  const dt = 1 / fps
  for (let frame = 0; frame < frames; frame++) {
    options.drive(sim, frame)
    sim.tick(dt, frame * dt)
    const { data } = ctx.getImageData(0, 0, width, height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, { palette, delay, repeat: 0 })
  }
  gif.finish()
  mkdirSync(ASSETS, { recursive: true })
  const bytes = gif.bytes()
  writeFileSync(resolve(ASSETS, `${name}.gif`), bytes)
  // eslint-disable-next-line no-console
  console.log(
    `✓ assets/${name}.gif  (${width}x${height}, ${frames}f, ${Math.round(bytes.length / 1024)} KB)`,
  )
}

// ---- Hero: a busy montage of many types ----
const HERO_TYPES = [
  "peony",
  "chrysanthemum",
  "willow",
  "ring",
  "crossette",
  "palm",
  "pistil",
  "spinner",
  "kamuro",
  "saturn",
  "butterfly",
  "multibreak",
]
renderGif({
  name: "hero",
  width: 600,
  height: 320,
  frames: 120,
  fps: 25,
  config: { intensity: "energetic", colors: palettes.rainbow },
  drive: (sim, frame) => {
    if (frame % 7 !== 0) return
    sim.launch({
      type: sim.rng.pick(HERO_TYPES),
      x: sim.rng.range(0.12, 0.88),
      y: sim.rng.range(0.2, 0.5),
      rise: true,
    } as Parameters<Simulation["launch"]>[0])
  },
})

// ---- One GIF per type for the README catalog (a curated subset; the live site
//      shows all 68) ----
const TYPE_COLORS: Record<string, ReadonlyArray<string>> = {
  willow: palettes.gold,
  kamuro: palettes.gold,
  brocade: palettes.gold,
  comet: palettes.gold,
  fountain: palettes.gold,
  horsetail: palettes.gold,
  palm: palettes.ember,
  tail: palettes.sunset,
  salute: palettes.hot,
  ring: palettes.ice,
  pearls: palettes.ice,
  spider: palettes.silver,
  strobe: palettes.silver,
  flitter: palettes.silver,
  crossette: palettes.neon,
  bees: palettes.neon,
  spinner: palettes.neon,
  fish: palettes.aurora,
  chrysanthemum: palettes.aurora,
  saturn: palettes.ice,
  butterfly: palettes.rainbow,
  heart: ["#ff2d6b", "#ff7ad9", "#ffd1dc"],
  star: palettes.gold,
}
const colorsFor = (type: string): ReadonlyArray<string> => TYPE_COLORS[type] ?? palettes.rainbow

const GALLERY = [
  "peony",
  "chrysanthemum",
  "dahlia",
  "willow",
  "kamuro",
  "brocade",
  "palm",
  "horsetail",
  "tail",
  "ring",
  "saturn",
  "pearls",
  "spider",
  "crossette",
  "pistil",
  "multibreak",
  "strobe",
  "flitter",
  "glitter",
  "comet",
  "fish",
  "bees",
  "spinner",
  "fountain",
  "salute",
  "heart",
  "star",
  "butterfly",
  "burst",
]
for (const type of GALLERY) {
  renderGif({
    name: `type-${type}`,
    width: 300,
    height: 250,
    frames: 56,
    fps: 22,
    config: { colors: colorsFor(type), intensity: "normal" },
    drive: (sim, frame) => {
      if (frame % 28 !== 0) return
      sim.launch({ type, x: 0.5, y: 0.44, power: 1.25, rise: false } as Parameters<
        Simulation["launch"]
      >[0])
    },
  })
}

// ---- Image fireworkify: real company logos forming from quantized breaks ----
const logoEffect = async (file: string, size: number): Promise<FireworkEffect> => {
  const img = await loadImage(resolve(ROOT, "tools/logos", file))
  const scale = size / Math.max(img.width, img.height)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const c = createCanvas(w, h)
  const x = c.getContext("2d")
  x.drawImage(img, 0, 0, w, h)
  const { data } = x.getImageData(0, 0, w, h)
  const points = sampleImageData(data as unknown as Uint8ClampedArray, w, h, {
    maxPoints: 720,
    colors: 8,
  })
  return imageEffect(points)
}

const LOGOS = ["chrome.svg", "github-icon.svg", "google.svg", "spotify.svg", "react.svg"]
const logoFx: Array<FireworkEffect> = []
for (const file of LOGOS) logoFx.push(await logoEffect(file, 92))

const LOGO_INTERVAL = 38
renderGif({
  name: "image",
  width: 500,
  height: 300,
  frames: LOGOS.length * LOGO_INTERVAL,
  fps: 25,
  config: { intensity: "normal" },
  drive: (sim, frame) => {
    if (frame % LOGO_INTERVAL !== 0) return
    const i = Math.floor(frame / LOGO_INTERVAL) % logoFx.length
    sim.launchEffect(logoFx[i], 0.5, 0.5, { count: 720, power: 1, life: 2.4 }, false)
  },
})
