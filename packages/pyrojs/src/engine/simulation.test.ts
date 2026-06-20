import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { decodeFireworksConfig, type FireworksConfig } from "../core/config.js"
import { Simulation } from "./simulation.js"
import type { SurfaceFactory } from "./renderer.js"

// A no-op 2D context + surface factory so the simulation can run fully headless.
const make2dMock = (): CanvasRenderingContext2D => {
  const gradient = { addColorStop: () => undefined }
  const ctx = {
    canvas: { width: 0, height: 0 },
    setTransform: () => undefined,
    clearRect: () => undefined,
    fillRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    drawImage: () => undefined,
    createRadialGradient: () => gradient,
    globalCompositeOperation: "source-over",
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
  }
  return ctx as unknown as CanvasRenderingContext2D
}

const mockSurfaceFactory: SurfaceFactory = (size) =>
  ({ width: size, height: size, getContext: () => make2dMock() }) as unknown as ReturnType<
    SurfaceFactory
  >

const makeConfig = (overrides: Record<string, unknown>): FireworksConfig =>
  Effect.runSync(decodeFireworksConfig({ autoplay: false, seed: 7, ...overrides }))

const makeSim = (config: FireworksConfig): Simulation =>
  new Simulation(make2dMock(), config, 7, mockSurfaceFactory)

const tickFor = (sim: Simulation, seconds: number): void => {
  const steps = Math.round(seconds / 0.016)
  for (let i = 0; i < steps; i++) sim.tick(0.016, i * 0.016)
}

describe("Simulation", () => {
  it("an in-place burst spawns stars that decay to zero", () => {
    const sim = makeSim(makeConfig({}))
    sim.resize(800, 600, 1)
    sim.launch({ type: "peony", x: 0.5, y: 0.5, rise: false })
    expect(sim.stats().particles).toBeGreaterThan(0)
    tickFor(sim, 6)
    expect(sim.stats().particles).toBe(0)
  })

  it("a rising shell ascends then bursts into stars", () => {
    const sim = makeSim(makeConfig({}))
    sim.resize(800, 600, 1)
    sim.launch({ type: "peony", x: 0.5, y: 0.3, rise: true })
    expect(sim.stats().shells).toBe(1)
    // advance past the rise so the shell detonates
    tickFor(sim, 1.4)
    expect(sim.stats().shells).toBe(0)
    expect(sim.stats().particles).toBeGreaterThan(0)
  })

  it("every catalog type can launch without throwing", () => {
    const sim = makeSim(makeConfig({}))
    sim.resize(800, 600, 1)
    const types = [
      "peony",
      "chrysanthemum",
      "willow",
      "palm",
      "ring",
      "crossette",
      "strobe",
      "brocade",
      "comet",
      "spider",
      "dahlia",
      "horsetail",
      "salute",
      "fountain",
      "heart",
      "star",
      "burst",
      "glitter",
    ] as const
    for (const type of types) {
      expect(() => sim.launch({ type, rise: false })).not.toThrow()
    }
    expect(sim.stats().particles).toBeGreaterThan(0)
  })

  it("clear() removes all particles and shells", () => {
    const sim = makeSim(makeConfig({}))
    sim.resize(800, 600, 1)
    sim.launch({ type: "peony", rise: true })
    sim.launch({ type: "ring", rise: false })
    sim.clear()
    expect(sim.stats().particles).toBe(0)
    expect(sim.stats().shells).toBe(0)
  })

  it("respects deterministic seeding", () => {
    const a = makeSim(makeConfig({}))
    const b = makeSim(makeConfig({}))
    a.resize(800, 600, 1)
    b.resize(800, 600, 1)
    a.launch({ type: "peony", x: 0.5, y: 0.5, rise: false })
    b.launch({ type: "peony", x: 0.5, y: 0.5, rise: false })
    expect(a.stats().particles).toBe(b.stats().particles)
  })
})
