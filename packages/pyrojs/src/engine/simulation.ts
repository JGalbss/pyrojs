import { parseColor, type Rgb } from "./color.js"
import { Random } from "./math/rng.js"
import { clamp } from "./math/scalar.js"
import { Particles, ParticleFlag } from "./particles.js"
import { CanvasRenderer, type RenderOptions, type SurfaceFactory } from "./renderer.js"
import { stepParticles, type Forces } from "./kernel.js"
import { getEffect } from "./effects/registry.js"
import type { BurstContext, Emitter, FireworkEffect, StarSpec } from "./emitter.js"
import type { FireworksConfig, LaunchSpec } from "../core/config.js"
import { intensityPresets } from "../core/config.js"

// The simulation is the imperative heart hosted by the Effect layer. It owns the
// particle store, renderer, RNG, in-flight shells, and per-frame advancement.
// Effects emit through it (it implements `Emitter`). One `tick()` is one frame.

export interface SimStats {
  readonly particles: number
  readonly capacity: number
  readonly shells: number
}

// Reference canvas dimension; power/size scale relative to this so a show looks
// the same on a phone and a 4K display.
const REFERENCE_DIMENSION = 800
const BASE_COUNT = 110
const BASE_POWER = 270
const BASE_SIZE = 2.4
const BASE_LIFE = 1.5
const BASE_DRAG = 0.9
const TRAIL_INTERVAL = 0.014

interface Shell {
  x: number
  y: number
  vx: number
  vy: number
  /** Upward deceleration tuned for a snappy, gravity-independent rise. */
  accel: number
  targetY: number
  ttl: number
  trailTimer: number
  trailColor: Rgb
  effect: FireworkEffect
  burst: ResolvedBurst
}

interface ResolvedBurst {
  colors: ReadonlyArray<Rgb>
  count: number
  power: number
  size: number
  life: number
  drag: number
}

const renderOptionsFrom = (config: FireworksConfig): RenderOptions => ({
  background: config.background,
  trail: config.trail,
  additive: config.additive,
  brightness: config.brightness,
})

const forcesFrom = (config: FireworksConfig): Forces => ({
  gravity: config.gravity,
  wind: config.wind,
  turbulence: config.turbulence,
})

export class Simulation implements Emitter {
  readonly rng: Random
  private readonly particles: Particles
  private readonly renderer: CanvasRenderer
  private config: FireworksConfig
  private forces: Forces
  private palette: ReadonlyArray<Rgb>
  private readonly shells: Array<Shell> = []
  private width: number = 0
  private height: number = 0

  constructor(
    ctx: CanvasRenderingContext2D,
    config: FireworksConfig,
    seed: number,
    surfaceFactory?: SurfaceFactory,
  ) {
    this.config = config
    this.rng = new Random(seed)
    this.particles = new Particles(2048, config.maxParticles)
    this.renderer = new CanvasRenderer(ctx, renderOptionsFrom(config), surfaceFactory)
    this.forces = forcesFrom(config)
    this.palette = config.colors.map(parseColor)
  }

  emit(star: StarSpec): void {
    this.particles.spawn({
      x: star.x,
      y: star.y,
      vx: star.vx,
      vy: star.vy,
      life: star.life,
      size: star.size,
      drag: star.drag,
      r: star.color.r,
      g: star.color.g,
      b: star.color.b,
      flags: star.flags,
      seed: this.rng.next(),
    })
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width
    this.height = height
    this.renderer.resize(width, height, dpr)
  }

  configure(config: FireworksConfig): void {
    this.config = config
    this.forces = forcesFrom(config)
    this.palette = config.colors.map(parseColor)
    this.renderer.configure(renderOptionsFrom(config))
  }

  private scaleFactor(): number {
    if (this.width === 0 || this.height === 0) return 1
    return Math.min(this.width, this.height) / REFERENCE_DIMENSION
  }

  private resolveBurst(spec: LaunchSpec): ResolvedBurst {
    const preset = intensityPresets[this.config.intensity]
    const scale = this.scaleFactor()
    const colors = resolveColors(spec.colors, this.palette)
    return {
      colors,
      count: Math.round((spec.count ?? BASE_COUNT) * preset.countScale),
      power: (spec.power ?? 1) * BASE_POWER * preset.powerScale * scale,
      size: (spec.size ?? 1) * BASE_SIZE * this.config.particleScale * clamp(scale, 0.6, 2.2),
      life: (spec.life ?? BASE_LIFE),
      drag: BASE_DRAG,
    }
  }

  /** Fire a firework. Either bursts in place or rises from the ground first. */
  launch(spec: LaunchSpec): void {
    const burst = this.resolveBurst(spec)
    const effect = getEffect(spec.type)
    const originX = (spec.x ?? this.rng.range(0.15, 0.85)) * this.width
    const targetY = (spec.y ?? this.rng.range(0.2, 0.5)) * this.height
    const rise = spec.rise ?? true

    if (!rise) {
      this.detonate(effect, originX, targetY, burst)
      return
    }
    this.launchShell(effect, originX, targetY, burst)
  }

  private launchShell(
    effect: FireworkEffect,
    originX: number,
    targetY: number,
    burst: ResolvedBurst,
  ): void {
    const startY = this.height
    const distance = Math.max(40, startY - targetY)
    const riseTime = this.rng.range(0.7, 1.15)
    const v0 = (2 * distance) / riseTime
    const accel = (2 * distance) / (riseTime * riseTime)
    this.shells.push({
      x: originX,
      y: startY,
      vx: this.rng.range(-12, 12),
      vy: -v0,
      accel,
      targetY,
      ttl: riseTime + 0.4,
      trailTimer: 0,
      trailColor: brightTrailColor(burst.colors, this.rng),
      effect,
      burst,
    })
  }

  private detonate(
    effect: FireworkEffect,
    x: number,
    y: number,
    burst: ResolvedBurst,
  ): void {
    const context: BurstContext = {
      x,
      y,
      colors: burst.colors,
      count: burst.count,
      power: burst.power,
      size: burst.size,
      life: burst.life,
      drag: burst.drag,
      rng: this.rng,
    }
    effect(this, context)
  }

  private updateShells(dt: number): void {
    let i = 0
    while (i < this.shells.length) {
      const shell = this.shells[i]
      shell.vy += shell.accel * dt
      shell.vx += this.forces.wind * dt
      shell.x += shell.vx * dt
      shell.y += shell.vy * dt
      shell.ttl -= dt
      this.emitShellTrail(shell, dt)

      if (shell.vy >= 0 || shell.y <= shell.targetY || shell.ttl <= 0) {
        this.detonate(shell.effect, shell.x, shell.y, shell.burst)
        this.shells.splice(i, 1)
        continue
      }
      i += 1
    }
  }

  private emitShellTrail(shell: Shell, dt: number): void {
    shell.trailTimer -= dt
    while (shell.trailTimer <= 0) {
      shell.trailTimer += TRAIL_INTERVAL
      this.emit({
        x: shell.x,
        y: shell.y,
        vx: this.rng.range(-8, 8),
        vy: this.rng.range(-6, 18),
        life: 0.45,
        size: BASE_SIZE * 0.8 * clamp(this.scaleFactor(), 0.6, 2.2),
        drag: 1.4,
        color: shell.trailColor,
        flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
      })
    }
  }

  /** Advance the whole simulation by `dt` seconds and render the frame. */
  tick(dt: number, timeSeconds: number): void {
    this.updateShells(dt)
    stepParticles(this.particles, dt, this.forces, this.rng)
    this.renderer.beginFrame()
    this.renderer.drawParticles(this.particles, timeSeconds)
  }

  clear(): void {
    this.particles.clear()
    this.shells.length = 0
  }

  stats(): SimStats {
    return {
      particles: this.particles.count,
      capacity: this.particles.getCapacity(),
      shells: this.shells.length,
    }
  }

  dispose(): void {
    this.clear()
    this.renderer.dispose()
  }
}

const resolveColors = (
  override: ReadonlyArray<string> | undefined,
  fallback: ReadonlyArray<Rgb>,
): ReadonlyArray<Rgb> => {
  if (override === undefined || override.length === 0) return fallback
  return override.map(parseColor)
}

const brightTrailColor = (colors: ReadonlyArray<Rgb>, rng: Random): Rgb => {
  if (colors.length === 0) return { r: 255, g: 240, b: 200 }
  return rng.pick(colors)
}
