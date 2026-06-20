import { writeFileSync } from "node:fs"
import { createCanvas } from "@napi-rs/canvas"
import { Effect } from "effect"
import { Simulation } from "../packages/pyrojs/src/engine/simulation.js"
import { decodeFireworksConfig } from "../packages/pyrojs/src/core/config.js"
import { palettes } from "../packages/pyrojs/src/engine/palettes.js"

const W = 640
const H = 360
const canvas = createCanvas(W, H)
const ctx = canvas.getContext("2d")
const config = Effect.runSync(
  decodeFireworksConfig({ autoplay: false, background: "#05060a", trail: 0.85, seed: 9, colors: palettes.rainbow }),
)
const sim = new Simulation(
  ctx as unknown as CanvasRenderingContext2D,
  config,
  9,
  ((size: number) => createCanvas(size, size)) as unknown as ConstructorParameters<typeof Simulation>[3],
)
sim.resize(W, H, 1)
ctx.fillStyle = "#05060a"
ctx.fillRect(0, 0, W, H)

const fire = (type: string, x: number, y: number): void =>
  sim.launch({ type, x, y, rise: false } as Parameters<Simulation["launch"]>[0])

fire("peony", 0.25, 0.35)
fire("willow", 0.5, 0.3)
fire("crossette", 0.75, 0.4)
fire("heart", 0.5, 0.6)
for (let i = 0; i < 26; i++) sim.tick(1 / 30, i / 30)

writeFileSync("/tmp/pyro-check.png", canvas.toBuffer("image/png"))
// eslint-disable-next-line no-console
console.log("wrote /tmp/pyro-check.png")
