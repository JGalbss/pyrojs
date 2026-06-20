import { writeFileSync } from "node:fs"
import { createCanvas } from "@napi-rs/canvas"
import { Effect } from "effect"
import { Simulation } from "../packages/pyrojs/src/engine/simulation.js"
import { decodeFireworksConfig } from "../packages/pyrojs/src/core/config.js"
import { palettes } from "../packages/pyrojs/src/engine/palettes.js"
import { imageEffect, sampleImageData } from "../packages/pyrojs/src/engine/image.js"

const W = 720
const H = 380
const canvas = createCanvas(W, H)
const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D
const config = Effect.runSync(
  decodeFireworksConfig({ autoplay: false, background: "#05060a", trail: 0.86, seed: 5, colors: palettes.rainbow }),
)
const sim = new Simulation(
  ctx,
  config,
  5,
  ((size: number) => createCanvas(size, size)) as unknown as ConstructorParameters<typeof Simulation>[3],
)
sim.resize(W, H, 1)
ctx.fillStyle = "#05060a"
ctx.fillRect(0, 0, W, H)

const fire = (type: string, x: number, y: number): void =>
  sim.launch({ type, x, y, rise: false } as Parameters<Simulation["launch"]>[0])

// New showpiece types
fire("pistil", 0.18, 0.32)
fire("spinner", 0.5, 0.3)
fire("kamuro", 0.82, 0.3)

// Image fireworkify: the word "PYRO"
const tc = createCanvas(260, 90)
const tctx = tc.getContext("2d") as unknown as CanvasRenderingContext2D
const grad = tctx.createLinearGradient(0, 0, 260, 0)
grad.addColorStop(0, "#ffd700")
grad.addColorStop(0.5, "#ff4da6")
grad.addColorStop(1, "#4dd2ff")
tctx.fillStyle = grad
tctx.font = "bold 70px sans-serif"
tctx.textAlign = "center"
tctx.textBaseline = "middle"
tctx.fillText("PYRO", 130, 45)
const { data } = tctx.getImageData(0, 0, 260, 90)
const points = sampleImageData(data, 260, 90, { maxPoints: 480 })
sim.launchEffect(imageEffect(points), 0.5, 0.62, { count: points.length, power: 1.1, life: 3 }, false)

for (let i = 0; i < 22; i++) sim.tick(1 / 30, i / 30)

writeFileSync("/tmp/pyro-check2.png", canvas.toBuffer("image/png"))
// eslint-disable-next-line no-console
console.log("wrote /tmp/pyro-check2.png")
