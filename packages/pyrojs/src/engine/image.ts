import type { Rgb } from "./color.js"
import { ParticleFlag } from "./particles.js"
import type { FireworkEffect } from "./emitter.js"

// Turn an image, SVG, or text into a firework. The source is rasterized, its
// colors are reduced to a handful of dominant "layers" with median-cut
// quantization (so the break reads as distinct posterized regions instead of a
// muddy gradient that washes out under additive blending), and each surviving
// pixel becomes a colored star.
// Browser-only at call time; nothing here touches the DOM at module load.

export interface ImagePoint {
  /** Centered, normalized position (~[-1, 1] on the longest axis). */
  readonly x: number
  readonly y: number
  readonly color: Rgb
}

export interface SampleImageOptions {
  /** Longest sampled dimension in pixels — higher is denser. Default 72. */
  readonly resolution?: number
  /** Cap on the number of emitted points. Default 900. */
  readonly maxPoints?: number
  /** Minimum pixel alpha (0–255) to include. Default 40. */
  readonly alphaThreshold?: number
  /** Number of color layers to quantize down to (0 = keep raw colors). Default 10. */
  readonly colors?: number
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas

const createSampleCanvas = (width: number, height: number): AnyCanvas => {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

const isRawSvg = (source: string): boolean => source.trim().startsWith("<svg")

const toImageSource = (source: string): string => {
  if (isRawSvg(source)) return `data:image/svg+xml,${encodeURIComponent(source)}`
  return source
}

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`pyrojs: failed to load image "${source}"`))
    image.src = toImageSource(source)
  })

const downsample = <T>(items: ReadonlyArray<T>, max: number): ReadonlyArray<T> => {
  if (items.length <= max) return items
  const stride = Math.ceil(items.length / max)
  const out: Array<T> = []
  for (let i = 0; i < items.length; i += stride) out.push(items[i])
  return out
}

// ---------------------------------------------------------------------------
// Median-cut color quantization: recursively split the color cloud along its
// widest channel until we have K buckets, then snap every pixel to its bucket's
// average. This finds the image's dominant colors (its "layers") rather than a
// fixed posterization, so a logo's few real colors survive cleanly.
// ---------------------------------------------------------------------------

const channelValue = (color: Rgb, axis: number): number => {
  if (axis === 0) return color.r
  if (axis === 1) return color.g
  return color.b
}

const longestAxis = (colors: ReadonlyArray<Rgb>): number => {
  let rMin = 255
  let rMax = 0
  let gMin = 255
  let gMax = 0
  let bMin = 255
  let bMax = 0
  for (const c of colors) {
    rMin = Math.min(rMin, c.r)
    rMax = Math.max(rMax, c.r)
    gMin = Math.min(gMin, c.g)
    gMax = Math.max(gMax, c.g)
    bMin = Math.min(bMin, c.b)
    bMax = Math.max(bMax, c.b)
  }
  const rRange = rMax - rMin
  const gRange = gMax - gMin
  const bRange = bMax - bMin
  if (rRange >= gRange && rRange >= bRange) return 0
  if (gRange >= bRange) return 1
  return 2
}

const boxRange = (colors: ReadonlyArray<Rgb>): number => {
  const axis = longestAxis(colors)
  let min = 255
  let max = 0
  for (const c of colors) {
    const v = channelValue(c, axis)
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  return max - min
}

const averageColor = (colors: ReadonlyArray<Rgb>): Rgb => {
  let r = 0
  let g = 0
  let b = 0
  for (const c of colors) {
    r += c.r
    g += c.g
    b += c.b
  }
  const n = Math.max(1, colors.length)
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

const widestBoxIndex = (boxes: ReadonlyArray<Array<Rgb>>): number => {
  let best = -1
  let bestRange = -1
  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i].length < 2) continue
    const range = boxRange(boxes[i])
    if (range > bestRange) {
      bestRange = range
      best = i
    }
  }
  return best
}

const medianCut = (colors: ReadonlyArray<Rgb>, k: number): ReadonlyArray<Rgb> => {
  if (colors.length === 0) return []
  const boxes: Array<Array<Rgb>> = [colors.slice()]
  while (boxes.length < k) {
    const idx = widestBoxIndex(boxes)
    if (idx === -1) break
    const box = boxes[idx]
    const axis = longestAxis(box)
    box.sort((a, b) => channelValue(a, axis) - channelValue(b, axis))
    const mid = box.length >> 1
    if (mid === 0) break
    boxes.splice(idx, 1, box.slice(0, mid), box.slice(mid))
  }
  return boxes.map(averageColor)
}

const nearestColor = (color: Rgb, palette: ReadonlyArray<Rgb>): Rgb => {
  let best = palette[0]
  let bestDistance = Infinity
  for (const candidate of palette) {
    const dr = color.r - candidate.r
    const dg = color.g - candidate.g
    const db = color.b - candidate.b
    const distance = dr * dr + dg * dg + db * db
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  return best
}

/** Reduce a list of colors to `levels` dominant layers, snapping each to the nearest. */
export const quantizeColors = (colors: ReadonlyArray<Rgb>, levels: number): ReadonlyArray<Rgb> => {
  if (levels <= 0 || colors.length === 0) return colors
  const palette = medianCut(colors, levels)
  if (palette.length === 0) return colors
  return colors.map((color) => nearestColor(color, palette))
}

// ---------------------------------------------------------------------------

/**
 * Sample an image URL, data URI, or raw SVG string into centered, color-layered
 * points that trace its shape. Pass the result to `imageEffect`.
 */
export const sampleImage = async (
  source: string,
  options: SampleImageOptions = {},
): Promise<ReadonlyArray<ImagePoint>> => {
  const image = await loadImage(source)
  const resolution = options.resolution ?? 72
  const longest = Math.max(image.width, image.height, 1)
  const scale = resolution / longest
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = createSampleCanvas(width, height)
  // DOM lib types the union getContext as the generic RenderingContext; narrow it.
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null
  if (ctx === null) return []
  ctx.drawImage(image, 0, 0, width, height)
  const { data } = ctx.getImageData(0, 0, width, height)
  return sampleImageData(data, width, height, options)
}

/** Sample raw RGBA pixel data into centered, color-layered points. Environment-agnostic. */
export const sampleImageData = (
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: SampleImageOptions = {},
): ReadonlyArray<ImagePoint> => {
  const alphaThreshold = options.alphaThreshold ?? 40
  const half = Math.max(width, height) / 2

  const positions: Array<{ x: number; y: number }> = []
  const colors: Array<Rgb> = []
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4
      if (data[idx + 3] < alphaThreshold) continue
      positions.push({ x: (px - width / 2) / half, y: (py - height / 2) / half })
      colors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] })
    }
  }

  const layered = quantizeColors(colors, options.colors ?? 10)
  const points: Array<ImagePoint> = positions.map((position, i) => ({
    x: position.x,
    y: position.y,
    color: layered[i],
  }))
  return downsample(points, options.maxPoints ?? 900)
}

export interface ImageEffectOptions {
  /** Outward velocity scale — how large the picture forms. Default 1. */
  readonly spread?: number
}

/** Build a firework effect that detonates into the sampled image. */
export const imageEffect = (
  points: ReadonlyArray<ImagePoint>,
  options: ImageEffectOptions = {},
): FireworkEffect => {
  const spread = options.spread ?? 1
  return (emit, ctx) => {
    for (const point of points) {
      const speed = ctx.power * spread
      emit.emit({
        x: ctx.x,
        y: ctx.y,
        vx: point.x * speed,
        vy: point.y * speed,
        life: ctx.life * 1.4,
        size: ctx.size,
        // High drag so stars decelerate crisply into the picture instead of
        // sailing through it into a blur.
        drag: ctx.drag * 3,
        color: point.color,
        flags: ParticleFlag.Glow,
      })
    }
  }
}
