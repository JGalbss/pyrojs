import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import { Effect } from "effect"
import { Simulation } from "../packages/pyrojs/src/engine/simulation.js"
import { decodeFireworksConfig } from "../packages/pyrojs/src/core/config.js"
import { palettes } from "../packages/pyrojs/src/engine/palettes.js"
import { imageEffect, sampleImageData } from "../packages/pyrojs/src/engine/image.js"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const W = 1040
const H = 320
const canvas = createCanvas(W, H)
const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D
const config = Effect.runSync(
  decodeFireworksConfig({ autoplay: false, background: "#05060a", trail: 0.88, seed: 8, colors: palettes.rainbow }),
)
const sim = new Simulation(
  ctx,
  config,
  8,
  ((size: number) => createCanvas(size, size)) as unknown as ConstructorParameters<typeof Simulation>[3],
)
sim.resize(W, H, 1)
ctx.fillStyle = "#05060a"
ctx.fillRect(0, 0, W, H)

const logoPoints = async (file: string, size: number) => {
  const img = await loadImage(resolve(ROOT, "tools/logos", file))
  const scale = size / Math.max(img.width, img.height)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const c = createCanvas(w, h)
  const x = c.getContext("2d")
  x.drawImage(img, 0, 0, w, h)
  const { data } = x.getImageData(0, 0, w, h)
  return sampleImageData(data as unknown as Uint8ClampedArray, w, h, { maxPoints: 700, colors: 8 })
}

const logos = ["chrome.svg", "github-icon.svg", "google.svg", "react.svg"]
const cols = logos.length
let idx = 0
for (const file of logos) {
  const points = await logoPoints(file, 80)
  const cx = (idx + 0.5) / cols
  sim.launchEffect(imageEffect(points), cx, 0.5, { count: points.length, power: 0.85, life: 3 }, false)
  idx += 1
}

for (let i = 0; i < 26; i++) sim.tick(1 / 30, i / 30)
writeFileSync("/tmp/pyro-logos.png", canvas.toBuffer("image/png"))
// eslint-disable-next-line no-console
console.log("wrote /tmp/pyro-logos.png")
