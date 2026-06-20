import { describe, expect, it } from "vitest"
import { createRandom } from "./rng.js"

describe("Random", () => {
  it("is deterministic for a given seed", () => {
    const a = createRandom(12345)
    const b = createRandom(12345)
    const seqA = Array.from({ length: 8 }, () => a.next())
    const seqB = Array.from({ length: 8 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it("produces different streams for different seeds", () => {
    const a = createRandom(1)
    const b = createRandom(2)
    expect(a.next()).not.toBe(b.next())
  })

  it("stays within [0,1)", () => {
    const r = createRandom(7)
    for (let i = 0; i < 1000; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it("respects range and int bounds", () => {
    const r = createRandom(99)
    for (let i = 0; i < 1000; i++) {
      const f = r.range(10, 20)
      expect(f).toBeGreaterThanOrEqual(10)
      expect(f).toBeLessThan(20)
      const n = r.int(0, 5)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(5)
      expect(Number.isInteger(n)).toBe(true)
    }
  })

  it("samples points within a sphere/disk radius", () => {
    const r = createRandom(3)
    for (let i = 0; i < 500; i++) {
      const p = r.inSphere(10)
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(10.0001)
      const d = r.inDisk(5)
      expect(Math.hypot(d.x, d.y)).toBeLessThanOrEqual(5.0001)
    }
  })

  it("picks from a non-empty array and throws on empty", () => {
    const r = createRandom(4)
    expect(["a", "b", "c"]).toContain(r.pick(["a", "b", "c"]))
    expect(() => r.pick([])).toThrow()
  })
})
