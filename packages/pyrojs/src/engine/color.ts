import { clamp } from "./math/scalar.js"

// Color utilities for the engine. Colors are kept as plain {r,g,b} byte triples
// (0–255) on the hot path; CSS string construction is cached by the renderer.

export interface Rgb {
  r: number
  g: number
  b: number
}

const toByte = (value: number): number => Math.round(clamp(value, 0, 255))

const expandShortHex = (hex: string): string =>
  hex
    .split("")
    .map((c) => c + c)
    .join("")

const parseHex = (input: string): Rgb | undefined => {
  const match = /^#?([0-9a-f]{3,8})$/i.exec(input.trim())
  if (match === null) return undefined
  const raw = match[1]
  if (raw === undefined) return undefined

  const six = normalizeHexLength(raw)
  if (six === undefined) return undefined

  const r = Number.parseInt(six.slice(0, 2), 16)
  const g = Number.parseInt(six.slice(2, 4), 16)
  const b = Number.parseInt(six.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined
  return { r, g, b }
}

const normalizeHexLength = (raw: string): string | undefined => {
  if (raw.length === 3) return expandShortHex(raw)
  if (raw.length === 4) return expandShortHex(raw.slice(0, 3))
  if (raw.length === 6) return raw
  if (raw.length === 8) return raw.slice(0, 6)
  return undefined
}

const parseRgbFunction = (input: string): Rgb | undefined => {
  const match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(input.trim())
  if (match === null) return undefined
  const [, r, g, b] = match
  if (r === undefined || g === undefined || b === undefined) return undefined
  return { r: toByte(Number(r)), g: toByte(Number(g)), b: toByte(Number(b)) }
}

const parseHslFunction = (input: string): Rgb | undefined => {
  const match = /^hsla?\(\s*([\d.]+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%/i.exec(input.trim())
  if (match === null) return undefined
  const [, h, s, l] = match
  if (h === undefined || s === undefined || l === undefined) return undefined
  return hslToRgb(Number(h), Number(s) / 100, Number(l) / 100)
}

/** Parse a hex / rgb() / hsl() color string into a byte triple. Throws on invalid input. */
export const parseColor = (input: string): Rgb => {
  const hex = parseHex(input)
  if (hex !== undefined) return hex
  const rgb = parseRgbFunction(input)
  if (rgb !== undefined) return rgb
  const hsl = parseHslFunction(input)
  if (hsl !== undefined) return hsl
  throw new Error(`pyrojs: unrecognized color "${input}" (use hex, rgb(), or hsl())`)
}

/** Non-throwing variant for boundary validation. */
export const tryParseColor = (input: string): Rgb | undefined => {
  const hex = parseHex(input)
  if (hex !== undefined) return hex
  const rgb = parseRgbFunction(input)
  if (rgb !== undefined) return rgb
  return parseHslFunction(input)
}

const hueToChannel = (p: number, q: number, tInput: number): number => {
  let t = tInput
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

const computeQ = (l: number, s: number): number => {
  if (l < 0.5) return l * (1 + s)
  return l + s - l * s
}

/** HSL (h in degrees, s/l in 0..1) to an RGB byte triple. */
export const hslToRgb = (h: number, s: number, l: number): Rgb => {
  const hn = (((h % 360) + 360) % 360) / 360
  if (s === 0) {
    const gray = toByte(l * 255)
    return { r: gray, g: gray, b: gray }
  }
  const q = computeQ(l, s)
  const p = 2 * l - q
  return {
    r: toByte(hueToChannel(p, q, hn + 1 / 3) * 255),
    g: toByte(hueToChannel(p, q, hn) * 255),
    b: toByte(hueToChannel(p, q, hn - 1 / 3) * 255),
  }
}

/** Linear interpolation between two colors. */
export const lerpColor = (from: Rgb, to: Rgb, t: number): Rgb => ({
  r: toByte(from.r + (to.r - from.r) * t),
  g: toByte(from.g + (to.g - from.g) * t),
  b: toByte(from.b + (to.b - from.b) * t),
})

/** Build a cacheable `rgba(...)` string. */
export const rgbToCss = (color: Rgb, alpha: number = 1): string =>
  `rgba(${color.r},${color.g},${color.b},${clamp(alpha, 0, 1)})`

/** Build a `#rrggbb` string. */
export const rgbToHex = (color: Rgb): string => {
  const part = (value: number): string => toByte(value).toString(16).padStart(2, "0")
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`
}

/** Pack an RGB triple into a single 0xRRGGBB integer (for color bucketing). */
export const packRgb = (color: Rgb): number =>
  (toByte(color.r) << 16) | (toByte(color.g) << 8) | toByte(color.b)

/** Evenly spaced hues across the spectrum — handy for rainbow effects. */
export const spectrum = (count: number, saturation: number = 1, lightness: number = 0.55): ReadonlyArray<Rgb> => {
  const out: Array<Rgb> = []
  for (let i = 0; i < count; i++) {
    out.push(hslToRgb((360 * i) / count, saturation, lightness))
  }
  return out
}
