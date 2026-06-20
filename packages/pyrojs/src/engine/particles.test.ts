import { describe, expect, it } from "vitest"
import { ParticleFlag, Particles } from "./particles.js"

const spawnAt = (store: Particles, x: number, y: number): number =>
  store.spawn({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 1,
    size: 2,
    drag: 0,
    r: 255,
    g: 255,
    b: 255,
    flags: ParticleFlag.None,
    seed: 0.5,
  })

describe("Particles", () => {
  it("spawns and tracks count", () => {
    const store = new Particles(8)
    expect(store.count).toBe(0)
    const i = spawnAt(store, 1, 2)
    expect(i).toBe(0)
    expect(store.count).toBe(1)
    expect(store.px[0]).toBe(1)
    expect(store.py[0]).toBe(2)
    expect(store.ppx[0]).toBe(1)
  })

  it("swap-removes to stay densely packed", () => {
    const store = new Particles(8)
    spawnAt(store, 10, 0)
    spawnAt(store, 20, 0)
    spawnAt(store, 30, 0)
    expect(store.count).toBe(3)
    // kill the middle; the last (30) should move into slot 1
    store.kill(1)
    expect(store.count).toBe(2)
    expect(store.px[1]).toBe(30)
    expect(store.px[0]).toBe(10)
  })

  it("killing the last element just shrinks count", () => {
    const store = new Particles(8)
    spawnAt(store, 10, 0)
    spawnAt(store, 20, 0)
    store.kill(1)
    expect(store.count).toBe(1)
    expect(store.px[0]).toBe(10)
  })

  it("grows capacity on demand", () => {
    const store = new Particles(2, 100)
    spawnAt(store, 1, 0)
    spawnAt(store, 2, 0)
    expect(store.getCapacity()).toBe(2)
    const i = spawnAt(store, 3, 0)
    expect(i).toBe(2)
    expect(store.getCapacity()).toBeGreaterThan(2)
    expect(store.px[2]).toBe(3)
  })

  it("drops spawns at max capacity", () => {
    const store = new Particles(2, 2)
    spawnAt(store, 1, 0)
    spawnAt(store, 2, 0)
    expect(spawnAt(store, 3, 0)).toBe(-1)
    expect(store.count).toBe(2)
  })

  it("clears without reallocating", () => {
    const store = new Particles(8)
    spawnAt(store, 1, 0)
    store.clear()
    expect(store.count).toBe(0)
    expect(store.getCapacity()).toBe(8)
  })
})
