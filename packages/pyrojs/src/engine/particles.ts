// Structure-of-Arrays particle store — the performance heart of the engine.
//
// Why SoA + typed arrays: iterating thousands of particles per frame must be
// cache-friendly and allocation-free. Each attribute lives in its own typed
// array; a particle is just an index. Dead particles are removed with
// swap-remove so the active range [0, count) stays densely packed with no holes
// and no per-particle objects for the GC to chase.
//
// This module is intentionally imperative (raw loops, in-place mutation): it is
// the CPU kernel that the Effect layer hosts inside a single `Effect.sync` per
// frame. It deliberately opts out of the functional style used elsewhere.

export const ParticleFlag = {
  None: 0,
  /** Flickers over its lifetime (strobe / glitter / crackle). */
  Twinkle: 1 << 0,
  /** Rendered as a streak from previous to current position (willow / comet). */
  Streak: 1 << 1,
  /** Holds full brightness instead of fading with age. */
  NoFade: 1 << 2,
  /** Additive glow sprite rather than a flat dot. */
  Glow: 1 << 3,
  /** Lerps from its color toward its target color (r2,g2,b2) over its life. */
  ColorShift: 1 << 4,
  /** Fades in, peaks mid-life, then fades out (ghost / lampare). */
  Ghost: 1 << 5,
} as const

export type ParticleFlag = (typeof ParticleFlag)[keyof typeof ParticleFlag]

const DEFAULT_CAPACITY = 4096

export interface ParticleInit {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  drag: number
  r: number
  g: number
  b: number
  /** Target color, lerped toward when the ColorShift flag is set. */
  r2: number
  g2: number
  b2: number
  flags: number
  seed: number
}

export class Particles {
  private capacity: number
  private readonly maxCapacity: number

  /** Number of live particles; live indices are [0, count). */
  count: number = 0

  px: Float32Array
  py: Float32Array
  vx: Float32Array
  vy: Float32Array
  /** Previous-frame position, used for streak rendering and interpolation. */
  ppx: Float32Array
  ppy: Float32Array
  life: Float32Array
  maxLife: Float32Array
  size: Float32Array
  drag: Float32Array
  /** Per-particle random phase in [0,1) for twinkle/jitter without extra RNG. */
  seed: Float32Array
  r: Uint8ClampedArray
  g: Uint8ClampedArray
  b: Uint8ClampedArray
  r2: Uint8ClampedArray
  g2: Uint8ClampedArray
  b2: Uint8ClampedArray
  flags: Uint8Array

  constructor(initialCapacity: number = DEFAULT_CAPACITY, maxCapacity: number = 200_000) {
    // The ceiling is authoritative: a small maxCapacity clamps the initial
    // allocation rather than being silently raised to it.
    this.maxCapacity = Math.max(1, maxCapacity)
    this.capacity = Math.min(Math.max(1, initialCapacity), this.maxCapacity)
    this.px = new Float32Array(this.capacity)
    this.py = new Float32Array(this.capacity)
    this.vx = new Float32Array(this.capacity)
    this.vy = new Float32Array(this.capacity)
    this.ppx = new Float32Array(this.capacity)
    this.ppy = new Float32Array(this.capacity)
    this.life = new Float32Array(this.capacity)
    this.maxLife = new Float32Array(this.capacity)
    this.size = new Float32Array(this.capacity)
    this.drag = new Float32Array(this.capacity)
    this.seed = new Float32Array(this.capacity)
    this.r = new Uint8ClampedArray(this.capacity)
    this.g = new Uint8ClampedArray(this.capacity)
    this.b = new Uint8ClampedArray(this.capacity)
    this.r2 = new Uint8ClampedArray(this.capacity)
    this.g2 = new Uint8ClampedArray(this.capacity)
    this.b2 = new Uint8ClampedArray(this.capacity)
    this.flags = new Uint8Array(this.capacity)
  }

  /** Current backing capacity (grows on demand up to maxCapacity). */
  getCapacity(): number {
    return this.capacity
  }

  /**
   * Allocate a particle slot and initialize it. Returns the index, or -1 when
   * the store is at maxCapacity (graceful degradation: extra spawns are dropped).
   */
  spawn(init: ParticleInit): number {
    if (this.count >= this.capacity) {
      const grew = this.grow()
      if (!grew) return -1
    }
    const i = this.count
    this.count = i + 1
    this.px[i] = init.x
    this.py[i] = init.y
    this.ppx[i] = init.x
    this.ppy[i] = init.y
    this.vx[i] = init.vx
    this.vy[i] = init.vy
    this.life[i] = init.life
    this.maxLife[i] = init.life
    this.size[i] = init.size
    this.drag[i] = init.drag
    this.seed[i] = init.seed
    this.r[i] = init.r
    this.g[i] = init.g
    this.b[i] = init.b
    this.r2[i] = init.r2
    this.g2[i] = init.g2
    this.b2[i] = init.b2
    this.flags[i] = init.flags
    return i
  }

  /**
   * Remove the particle at `index` via swap-remove. The last live particle is
   * moved into the freed slot, so callers iterating forward should re-check the
   * same index after calling this (its contents changed).
   */
  kill(index: number): void {
    const last = this.count - 1
    if (index !== last) this.copyInto(index, last)
    this.count = last
  }

  /** Drop all particles without reallocating. */
  clear(): void {
    this.count = 0
  }

  private copyInto(dst: number, src: number): void {
    this.px[dst] = this.px[src]
    this.py[dst] = this.py[src]
    this.ppx[dst] = this.ppx[src]
    this.ppy[dst] = this.ppy[src]
    this.vx[dst] = this.vx[src]
    this.vy[dst] = this.vy[src]
    this.life[dst] = this.life[src]
    this.maxLife[dst] = this.maxLife[src]
    this.size[dst] = this.size[src]
    this.drag[dst] = this.drag[src]
    this.seed[dst] = this.seed[src]
    this.r[dst] = this.r[src]
    this.g[dst] = this.g[src]
    this.b[dst] = this.b[src]
    this.r2[dst] = this.r2[src]
    this.g2[dst] = this.g2[src]
    this.b2[dst] = this.b2[src]
    this.flags[dst] = this.flags[src]
  }

  private grow(): boolean {
    if (this.capacity >= this.maxCapacity) return false
    const next = Math.min(this.maxCapacity, Math.ceil(this.capacity * 1.5))
    this.px = growFloat(this.px, next)
    this.py = growFloat(this.py, next)
    this.vx = growFloat(this.vx, next)
    this.vy = growFloat(this.vy, next)
    this.ppx = growFloat(this.ppx, next)
    this.ppy = growFloat(this.ppy, next)
    this.life = growFloat(this.life, next)
    this.maxLife = growFloat(this.maxLife, next)
    this.size = growFloat(this.size, next)
    this.drag = growFloat(this.drag, next)
    this.seed = growFloat(this.seed, next)
    this.r = growClamped(this.r, next)
    this.g = growClamped(this.g, next)
    this.b = growClamped(this.b, next)
    this.r2 = growClamped(this.r2, next)
    this.g2 = growClamped(this.g2, next)
    this.b2 = growClamped(this.b2, next)
    this.flags = growByte(this.flags, next)
    this.capacity = next
    return true
  }
}

const growFloat = (source: Float32Array, size: number): Float32Array => {
  const out = new Float32Array(size)
  out.set(source)
  return out
}

const growClamped = (source: Uint8ClampedArray, size: number): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(size)
  out.set(source)
  return out
}

const growByte = (source: Uint8Array, size: number): Uint8Array => {
  const out = new Uint8Array(size)
  out.set(source)
  return out
}
