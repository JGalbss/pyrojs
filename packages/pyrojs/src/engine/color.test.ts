import { describe, expect, it } from "vitest"
import {
  hslToRgb,
  lerpColor,
  packRgb,
  parseColor,
  rgbToHex,
  spectrum,
  tryParseColor,
} from "./color.js"

describe("color", () => {
  it("parses hex in 3, 6, and 8 digit forms", () => {
    expect(parseColor("#f00")).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor("#00ff00")).toEqual({ r: 0, g: 255, b: 0 })
    expect(parseColor("#0000ffff")).toEqual({ r: 0, g: 0, b: 255 })
    expect(parseColor("ffffff")).toEqual({ r: 255, g: 255, b: 255 })
  })

  it("parses rgb() and hsl()", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 })
    expect(parseColor("rgba(10 20 30 / 0.5)")).toEqual({ r: 10, g: 20, b: 30 })
    expect(parseColor("hsl(0, 100%, 50%)")).toEqual({ r: 255, g: 0, b: 0 })
  })

  it("throws on invalid colors but tryParseColor returns undefined", () => {
    expect(() => parseColor("not-a-color")).toThrow()
    expect(tryParseColor("not-a-color")).toBeUndefined()
  })

  it("converts hsl to rgb", () => {
    expect(hslToRgb(120, 1, 0.5)).toEqual({ r: 0, g: 255, b: 0 })
    expect(hslToRgb(0, 0, 0.5)).toEqual({ r: 128, g: 128, b: 128 })
  })

  it("interpolates colors", () => {
    expect(lerpColor({ r: 0, g: 0, b: 0 }, { r: 100, g: 200, b: 50 }, 0.5)).toEqual({
      r: 50,
      g: 100,
      b: 25,
    })
  })

  it("round-trips through hex and packs", () => {
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#ff8000")
    expect(packRgb({ r: 255, g: 0, b: 255 })).toBe(0xff00ff)
  })

  it("builds an evenly sized spectrum", () => {
    expect(spectrum(6)).toHaveLength(6)
  })
})
