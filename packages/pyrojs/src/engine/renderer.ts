import { Particles, ParticleFlag } from "./particles.js"
import { TAU } from "./math/scalar.js"

// Canvas2D renderer. Draws the particle store with additive blending and
// cached radial-gradient glow sprites (drawImage is GPU-accelerated and far
// cheaper than per-particle shadowBlur). Motion trails are produced by fading
// the previous frame rather than clearing it — using `destination-out` so it
// also works on a transparent overlay canvas without tinting the page behind.
//
// Hot path: raw loops + cached state. Hosted by the Effect layer inside a single
// Effect.sync per frame.

export interface RenderOptions {
  /** Background fill. "transparent" keeps the canvas see-through (overlay mode). */
  readonly background: string
  /** Trail persistence, 0 (clear every frame) … 1 (never fade, infinite trails). */
  readonly trail: number
  /** Additive blending makes overlapping sparks glow. */
  readonly additive: boolean
  /** Global brightness multiplier applied to every particle. */
  readonly brightness: number
}

export const defaultRenderOptions: RenderOptions = {
  background: "transparent",
  trail: 0.82,
  additive: true,
  brightness: 1,
}

export interface Renderer {
  readonly width: number
  readonly height: number
  resize(width: number, height: number, dpr: number): void
  configure(options: RenderOptions): void
  beginFrame(dt: number): void
  drawParticles(particles: Particles, timeSeconds: number): void
  dispose(): void
}

type SpriteCanvas = HTMLCanvasElement | OffscreenCanvas

/** Creates an offscreen surface for glow sprites. Injectable for headless use. */
export type SurfaceFactory = (size: number) => SpriteCanvas

const isTransparent = (background: string): boolean =>
  background === "transparent" || background === "none"

const defaultSurfaceFactory: SurfaceFactory = (size) => {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  return canvas
}

const SPRITE_SIZE = 64
const SPRITE_HALF = SPRITE_SIZE / 2
// Quantize color to 5 bits/channel so the sprite cache stays tiny even when
// effects sweep through continuous color transitions.
const quantizeColor = (r: number, g: number, b: number): number =>
  ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)

export class CanvasRenderer implements Renderer {
  private readonly ctx: CanvasRenderingContext2D
  private options: RenderOptions
  private dpr: number = 1
  width: number = 0
  height: number = 0

  private readonly spriteCache = new Map<number, SpriteCanvas>()
  private readonly cssCache = new Map<number, string>()
  private readonly surfaceFactory: SurfaceFactory

  constructor(
    ctx: CanvasRenderingContext2D,
    options: RenderOptions = defaultRenderOptions,
    surfaceFactory: SurfaceFactory = defaultSurfaceFactory,
  ) {
    this.ctx = ctx
    this.options = options
    this.surfaceFactory = surfaceFactory
  }

  configure(options: RenderOptions): void {
    this.options = options
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width
    this.height = height
    this.dpr = dpr
    const canvas = this.ctx.canvas
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    // Draw in CSS pixels; the context maps to device pixels.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  beginFrame(dt: number): void {
    const ctx = this.ctx
    ctx.setTransform(dpr1(this.dpr), 0, 0, dpr1(this.dpr), 0, 0)
    const fade = frameFade(this.options.trail, dt)

    if (fade >= 1) {
      this.clearFull()
      return
    }
    this.fadePreviousFrame(fade)
  }

  private clearFull(): void {
    const ctx = this.ctx
    if (isTransparent(this.options.background)) {
      ctx.clearRect(0, 0, this.width, this.height)
      return
    }
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = this.options.background
    ctx.fillRect(0, 0, this.width, this.height)
  }

  private fadePreviousFrame(fade: number): void {
    const ctx = this.ctx
    if (isTransparent(this.options.background)) {
      // Reduce alpha of existing pixels to fade trails while staying see-through.
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = `rgba(0,0,0,${fade})`
      ctx.fillRect(0, 0, this.width, this.height)
      ctx.globalCompositeOperation = "source-over"
      return
    }
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = withAlpha(this.options.background, fade)
    ctx.fillRect(0, 0, this.width, this.height)
  }

  drawParticles(particles: Particles, timeSeconds: number): void {
    const ctx = this.ctx
    ctx.globalCompositeOperation = compositeFor(this.options.additive)
    const brightness = this.options.brightness
    const count = particles.count

    for (let i = 0; i < count; i++) {
      const ratio = lifeRatio(particles.life[i], particles.maxLife[i])
      const flags = particles.flags[i]
      const alpha = particleAlpha(ratio, flags, particles.seed[i], timeSeconds) * brightness
      if (alpha <= 0.003) continue

      ctx.globalAlpha = Math.min(alpha, 1)
      // Color shift: lerp toward the target color over the particle's life
      // (t is 0 when the ColorShift flag is absent, so this is a no-op then).
      const t = colorShiftT(flags, ratio)
      const r = (particles.r[i] + (particles.r2[i] - particles.r[i]) * t) | 0
      const g = (particles.g[i] + (particles.g2[i] - particles.g[i]) * t) | 0
      const b = (particles.b[i] + (particles.b2[i] - particles.b[i]) * t) | 0

      if ((flags & ParticleFlag.Streak) !== 0) {
        this.drawStreak(particles, i, r, g, b)
        continue
      }
      this.drawGlow(particles.px[i], particles.py[i], particles.size[i], r, g, b)
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
  }

  private drawGlow(x: number, y: number, size: number, r: number, g: number, b: number): void {
    const sprite = this.glowSprite(r, g, b)
    const diameter = size * 4
    this.ctx.drawImage(sprite, x - diameter / 2, y - diameter / 2, diameter, diameter)
  }

  private drawStreak(particles: Particles, i: number, r: number, g: number, b: number): void {
    const ctx = this.ctx
    ctx.strokeStyle = this.cssColor(r, g, b)
    ctx.lineWidth = particles.size[i]
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(particles.ppx[i], particles.ppy[i])
    ctx.lineTo(particles.px[i], particles.py[i])
    ctx.stroke()
  }

  private glowSprite(r: number, g: number, b: number): SpriteCanvas {
    const key = quantizeColor(r, g, b)
    const cached = this.spriteCache.get(key)
    if (cached !== undefined) return cached
    if (this.spriteCache.size > 1024) this.spriteCache.clear()

    const surface = this.surfaceFactory(SPRITE_SIZE)
    // The DOM lib types getContext("2d") on an HTMLCanvasElement | OffscreenCanvas
    // union as the generic RenderingContext; narrow it to the 2D context we know
    // both produce. Internal plumbing, not a validation boundary.
    const sctx = surface.getContext("2d") as CanvasRenderingContext2D | null
    if (sctx === null) throw new Error("pyrojs: could not create glow sprite context")
    const gradient = sctx.createRadialGradient(
      SPRITE_HALF,
      SPRITE_HALF,
      0,
      SPRITE_HALF,
      SPRITE_HALF,
      SPRITE_HALF,
    )
    gradient.addColorStop(0, `rgba(${r},${g},${b},1)`)
    gradient.addColorStop(0.35, `rgba(${r},${g},${b},0.55)`)
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
    sctx.fillStyle = gradient
    sctx.beginPath()
    sctx.arc(SPRITE_HALF, SPRITE_HALF, SPRITE_HALF, 0, TAU)
    sctx.fill()
    this.spriteCache.set(key, surface)
    return surface
  }

  private cssColor(r: number, g: number, b: number): string {
    const key = quantizeColor(r, g, b)
    const cached = this.cssCache.get(key)
    if (cached !== undefined) return cached
    const css = `rgb(${r},${g},${b})`
    this.cssCache.set(key, css)
    return css
  }

  dispose(): void {
    this.spriteCache.clear()
    this.cssCache.clear()
  }
}

const compositeFor = (additive: boolean): GlobalCompositeOperation => {
  if (additive) return "lighter"
  return "source-over"
}

const dpr1 = (dpr: number): number => {
  if (dpr > 0) return dpr
  return 1
}

const REFERENCE_DT = 1 / 60

// Time-based per-frame fade so trail length is the same at any frame rate.
// `trail` is the retention over one 60fps frame; we rescale it to the actual dt.
// trail=0 → full clear; floored so trails always eventually clear.
const frameFade = (trail: number, dt: number): number => {
  if (trail <= 0) return 1
  if (dt <= 0) return 0
  const retention = Math.pow(trail, dt / REFERENCE_DT)
  return Math.max(1 - retention, 0.02)
}

const lifeRatio = (life: number, maxLife: number): number => {
  if (maxLife <= 0) return 0
  const ratio = life / maxLife
  if (ratio < 0) return 0
  if (ratio > 1) return 1
  return ratio
}

const TWINKLE_FREQUENCY = 34

const baseAlpha = (ratio: number, flags: number): number => {
  if ((flags & ParticleFlag.Ghost) !== 0) return Math.sin(Math.PI * (1 - ratio))
  if ((flags & ParticleFlag.NoFade) !== 0) return 1
  return ratio
}

// Lerp amount toward the target color: grows with age when ColorShift is set,
// otherwise 0 (so the lerp is a no-op).
const colorShiftT = (flags: number, ratio: number): number => {
  if ((flags & ParticleFlag.ColorShift) !== 0) return 1 - ratio
  return 0
}

const particleAlpha = (
  ratio: number,
  flags: number,
  seed: number,
  timeSeconds: number,
): number => {
  const base = baseAlpha(ratio, flags)
  if ((flags & ParticleFlag.Twinkle) === 0) return base
  const flicker = 0.45 + 0.55 * Math.sin(timeSeconds * TWINKLE_FREQUENCY + seed * TAU)
  return base * flicker
}

const withAlpha = (background: string, alpha: number): string => {
  // For opaque backgrounds, reuse the configured color but force an alpha so the
  // fill only partially covers the previous frame (producing trails).
  const hexMatch = /^#([0-9a-f]{6})$/i.exec(background.trim())
  if (hexMatch === null) return `rgba(0,0,0,${alpha})`
  const hex = hexMatch[1] ?? "000000"
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
