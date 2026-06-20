import type { Rgb } from "./color.js"
import { ParticleFlag } from "./particles.js"
import type { FireworkEffect } from "./emitter.js"

// Turn an image or SVG into a firework. The source is rasterized to a small grid,
// opaque pixels become colored stars, and an effect launches them outward so the
// break momentarily paints the picture before gravity reclaims it.
// Browser-only at call time; nothing here touches the DOM at module load.

export interface ImagePoint {
  /** Centered, normalized position (~[-1, 1] on the longest axis). */
  readonly x: number
  readonly y: number
  readonly color: Rgb
}

export interface SampleImageOptions {
  /** Longest sampled dimension in pixels — higher is denser. Default 64. */
  readonly resolution?: number
  /** Cap on the number of emitted points. Default 700. */
  readonly maxPoints?: number
  /** Minimum pixel alpha (0–255) to include. Default 40. */
  readonly alphaThreshold?: number
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

const downsample = (
  points: ReadonlyArray<ImagePoint>,
  max: number,
): ReadonlyArray<ImagePoint> => {
  if (points.length <= max) return points
  const stride = Math.ceil(points.length / max)
  const out: Array<ImagePoint> = []
  for (let i = 0; i < points.length; i += stride) out.push(points[i])
  return out
}

/**
 * Sample an image URL, data URI, or raw SVG string into centered, colored points
 * that trace its shape. Pass the result to `imageEffect`.
 */
export const sampleImage = async (
  source: string,
  options: SampleImageOptions = {},
): Promise<ReadonlyArray<ImagePoint>> => {
  const image = await loadImage(source)
  const resolution = options.resolution ?? 64
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

/** Sample raw RGBA pixel data into centered, colored points. Environment-agnostic. */
export const sampleImageData = (
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: SampleImageOptions = {},
): ReadonlyArray<ImagePoint> => {
  const alphaThreshold = options.alphaThreshold ?? 40
  const half = Math.max(width, height) / 2
  const collected: Array<ImagePoint> = []
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4
      if (data[idx + 3] < alphaThreshold) continue
      collected.push({
        x: (px - width / 2) / half,
        y: (py - height / 2) / half,
        color: { r: data[idx], g: data[idx + 1], b: data[idx + 2] },
      })
    }
  }
  return downsample(collected, options.maxPoints ?? 700)
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
        life: ctx.life * 1.35,
        size: ctx.size,
        drag: ctx.drag * 2.4,
        color: point.color,
        flags: ParticleFlag.Glow,
      })
    }
  }
}
