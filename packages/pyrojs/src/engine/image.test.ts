import { describe, expect, it } from "vitest"
import { imageEffect, sampleImageData } from "./image.js"

describe("image sampling", () => {
  it("samples opaque pixels into centered, colored points", () => {
    // 2x2: top-left red (opaque), bottom-right green (opaque), others transparent
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 255, 0, 255,
    ])
    const points = sampleImageData(data, 2, 2)
    expect(points).toHaveLength(2)
    expect(points[0].color).toEqual({ r: 255, g: 0, b: 0 })
    expect(points[1].color).toEqual({ r: 0, g: 255, b: 0 })
  })

  it("skips pixels below the alpha threshold", () => {
    const faint = new Uint8ClampedArray([255, 255, 255, 10])
    expect(sampleImageData(faint, 1, 1)).toHaveLength(0)
  })

  it("downsamples to maxPoints", () => {
    const data = new Uint8ClampedArray(10 * 10 * 4)
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 255
    expect(sampleImageData(data, 10, 10, { maxPoints: 20 }).length).toBeLessThanOrEqual(20)
  })

  it("imageEffect builds a usable effect", () => {
    const points = [
      { x: -0.5, y: -0.5, color: { r: 255, g: 0, b: 0 } },
      { x: 0.5, y: 0.5, color: { r: 0, g: 0, b: 255 } },
    ]
    expect(typeof imageEffect(points)).toBe("function")
  })
})
