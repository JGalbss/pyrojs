import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createCanvas } from "@napi-rs/canvas"
import * as gifencNamespace from "gifenc"

// gifenc ships as CJS with no exports map; its functions hang off the default.
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
import { Effect } from "effect"
import { Simulation } from "../packages/pyrojs/src/engine/simulation.js"
import { decodeFireworksConfig } from "../packages/pyrojs/src/core/config.js"
import { palettes } from "../packages/pyrojs/src/engine/palettes.js"

// Headless GIF renderer for the README. Drives the real engine through
// @napi-rs/canvas (Skia) and encodes each frame with gifenc. No browser needed.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ASSETS = resolve(ROOT, "assets")
const BG = "#05060a"

interface GifOptions {
  readonly name: string
  readonly width: number
  readonly height: number
  readonly frames: number
  readonly fps: number
  readonly config?: Record<string, unknown>
  readonly drive: (sim: Simulation, frame: number) => void
}

const renderGif = (options: GifOptions): void => {
  const { name, width, height, frames, fps } = options
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  const surfaceFactory = (size: number) => createCanvas(size, size)

  const config = Effect.runSync(
    decodeFireworksConfig({
      autoplay: false,
      background: BG,
      trail: 0.85,
      seed: 1337,
      ...options.config,
    }),
  )

  const sim = new Simulation(
    ctx as unknown as CanvasRenderingContext2D,
    config,
    config.seed ?? 1337,
    surfaceFactory as unknown as ConstructorParameters<typeof Simulation>[3],
  )
  sim.resize(width, height, 1)

  // Start from a solid background so every GIF frame is fully opaque.
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)

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
  const kb = Math.round(bytes.length / 1024)
  // eslint-disable-next-line no-console
  console.log(`✓ assets/${name}.gif  (${width}x${height}, ${frames}f, ${kb} KB)`)
}

// Fire `type` on a steady cadence, centered-ish, so the burst reads clearly.
const cadence = (
  type: string,
  everyFrames: number,
  area: { x: [number, number]; y: [number, number] } = { x: [0.32, 0.68], y: [0.28, 0.42] },
) => {
  return (sim: Simulation, frame: number): void => {
    if (frame % everyFrames !== 0) return
    sim.launch({
      type,
      x: sim.rng.range(area.x[0], area.x[1]),
      y: sim.rng.range(area.y[0], area.y[1]),
      rise: true,
    } as Parameters<Simulation["launch"]>[0])
  }
}

const HERO_TYPES = [
  "peony",
  "chrysanthemum",
  "willow",
  "ring",
  "crossette",
  "palm",
  "brocade",
  "heart",
  "star",
]

const heroDrive = (sim: Simulation, frame: number): void => {
  if (frame % 7 !== 0) return
  const type = sim.rng.pick(HERO_TYPES)
  sim.launch({
    type,
    x: sim.rng.range(0.12, 0.88),
    y: sim.rng.range(0.2, 0.5),
    rise: true,
  } as Parameters<Simulation["launch"]>[0])
}

renderGif({
  name: "hero",
  width: 600,
  height: 320,
  frames: 120,
  fps: 25,
  config: { intensity: "energetic", colors: palettes.rainbow },
  drive: heroDrive,
})

const TYPE_GIFS: ReadonlyArray<{ name: string; type: string; colors: ReadonlyArray<string> }> = [
  { name: "peony", type: "peony", colors: palettes.gold },
  { name: "chrysanthemum", type: "chrysanthemum", colors: palettes.aurora },
  { name: "willow", type: "willow", colors: palettes.gold },
  { name: "crossette", type: "crossette", colors: palettes.neon },
  { name: "ring", type: "ring", colors: palettes.ice },
  { name: "heart", type: "heart", colors: ["#ff2d6b", "#ff7ad9", "#ffd1dc"] },
  { name: "palm", type: "palm", colors: palettes.ember },
  { name: "strobe", type: "strobe", colors: palettes.silver },
]

for (const { name, type, colors } of TYPE_GIFS) {
  renderGif({
    name: `type-${name}`,
    width: 360,
    height: 300,
    frames: 80,
    fps: 25,
    config: { colors },
    drive: cadence(type, 34),
  })
}
