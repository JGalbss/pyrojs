import { describe, expect, it } from "vitest"
import {
  approxEqual,
  clamp,
  clamp01,
  degToRad,
  inverseLerp,
  lerp,
  remap,
  smoothstep,
  TAU,
} from "./scalar.js"

describe("scalar", () => {
  it("clamps to range", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(-2)).toBe(0)
  })

  it("lerps and inverse-lerps", () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(inverseLerp(0, 10, 5)).toBe(0.5)
    expect(inverseLerp(4, 4, 4)).toBe(0)
  })

  it("remaps across ranges", () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50)
  })

  it("smoothstep is 0 at 0 and 1 at 1", () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(0.5)).toBeCloseTo(0.5)
  })

  it("converts degrees to radians", () => {
    expect(approxEqual(degToRad(180), Math.PI)).toBe(true)
    expect(approxEqual(TAU, Math.PI * 2)).toBe(true)
  })
})
