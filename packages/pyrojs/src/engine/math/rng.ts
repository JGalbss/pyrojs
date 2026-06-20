import { TAU } from "./scalar.js"

// Deterministic, fast PRNG (mulberry32). A seeded generator makes shows
// reproducible and the engine testable. The hot path mutates a single
// integer of internal state — no allocations per draw.

export interface Vec2Like {
  x: number
  y: number
}

const MULBERRY_INCREMENT = 0x6d2b79f5

export class Random {
  private state: number

  constructor(seed: number) {
    // Coerce to a 32-bit integer; 0 is a valid seed.
    this.state = seed | 0
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + MULBERRY_INCREMENT) | 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  /** Integer in [minInclusive, maxInclusive]. */
  int(minInclusive: number, maxInclusive: number): number {
    return Math.floor(this.range(minInclusive, maxInclusive + 1))
  }

  /** True with the given probability (default 0.5). */
  bool(probability: number = 0.5): boolean {
    return this.next() < probability
  }

  /** Either -1 or 1, never 0. */
  sign(): number {
    return Math.sign(this.next() - 0.5) || 1
  }

  /** Angle in radians, [0, 2π). */
  angle(): number {
    return this.next() * TAU
  }

  /** Normally distributed value via Box–Muller. */
  gaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = 1 - this.next()
    const u2 = this.next()
    const magnitude = Math.sqrt(-2 * Math.log(u1))
    return mean + stdDev * magnitude * Math.cos(TAU * u2)
  }

  /** Uniform point on the unit circle, scaled by `radius`. */
  onCircle(radius: number = 1): Vec2Like {
    const a = this.angle()
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius }
  }

  /** Uniform point inside a disk of `radius` (area-uniform, not angle-biased). */
  inDisk(radius: number = 1): Vec2Like {
    const r = radius * Math.sqrt(this.next())
    const a = this.angle()
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  }

  /**
   * Point on a unit sphere projected to 2D. Sampling a sphere and dropping the
   * z axis yields the denser-at-edges look of a real spherical shell break.
   */
  inSphere(radius: number = 1): Vec2Like {
    const z = this.range(-1, 1)
    const a = this.angle()
    const ring = Math.sqrt(1 - z * z)
    return { x: Math.cos(a) * ring * radius, y: Math.sin(a) * ring * radius }
  }

  /** Pick a uniformly random element. Throws on an empty array. */
  pick<T>(items: ReadonlyArray<T>): T {
    const value = items[Math.floor(this.next() * items.length)]
    if (value !== undefined) return value
    throw new Error("Random.pick() requires a non-empty array")
  }
}

export const createRandom = (seed: number): Random => new Random(seed)

// A non-deterministic seed for the default (unseeded) case. Library code may
// use the platform RNG here; everything downstream is deterministic given a seed.
export const randomSeed = (): number => Math.floor(Math.random() * 0xffffffff)
