import type { Rgb } from "./color.js"
import type { Random } from "./math/rng.js"

// The contract between firework "effects" (burst patterns) and the simulation.
// An effect is a pure function that, given a burst context, emits stars. It never
// touches the particle store directly — the simulation provides the `Emitter`,
// keeping effects portable and testable.

export interface StarSpec {
  x: number
  y: number
  vx: number
  vy: number
  /** Lifetime in seconds. */
  life: number
  /** Radius in px. */
  size: number
  /** Air drag coefficient. */
  drag: number
  color: Rgb
  /** Bitmask from ParticleFlag. */
  flags: number
}

export interface Emitter {
  readonly rng: Random
  emit(star: StarSpec): void
}

/** Everything an effect needs to lay down a break, already resolved + scaled. */
export interface BurstContext {
  /** Origin X in px. */
  readonly x: number
  /** Origin Y in px. */
  readonly y: number
  readonly colors: ReadonlyArray<Rgb>
  /** Number of stars to emit. */
  readonly count: number
  /** Base outward velocity in px/s. */
  readonly power: number
  /** Base star radius in px. */
  readonly size: number
  /** Base star lifetime in seconds. */
  readonly life: number
  /** Base drag coefficient. */
  readonly drag: number
  readonly rng: Random
}

export type FireworkEffect = (emit: Emitter, context: BurstContext) => void

/** Pick a color from the burst palette. */
export const pickColor = (context: BurstContext): Rgb => context.rng.pick(context.colors)

/** Random multiplier in [1-spread, 1+spread]. */
export const jitter = (rng: Random, spread: number): number => 1 + (rng.next() * 2 - 1) * spread
