import { Cause, Effect, Exit, Scope } from "effect"
import {
  makeEngine,
  type EngineStats,
  type FinaleOptions,
  type PyroEngine,
} from "./engine.js"
import type { FireworksConfigInput, LaunchSpecInput } from "./config.js"
import type { BurstOverrides } from "../engine/simulation.js"
import type { FireworkEffect } from "../engine/emitter.js"
import {
  imageEffect,
  sampleImage,
  type ImageEffectOptions,
  type SampleImageOptions,
} from "../engine/image.js"

// Imperative facade over the Effect engine. Vanilla users never touch an Effect
// value: construction runs the program under a long-lived Scope, and each method
// runs its (synchronous) Effect at the boundary, rethrowing tagged errors as
// ordinary exceptions. `destroy()` closes the scope, which interrupts the forked
// fibers (render loop, autopilot, finales, shows) and runs every finalizer.

export interface LaunchEffectOptions extends BurstOverrides {
  /** Normalized origin (0..1). Defaults to center-ish. */
  readonly x?: number
  readonly y?: number
  /** Launch as a rising shell instead of bursting in place. */
  readonly rise?: boolean
}

export interface LaunchImageOptions extends SampleImageOptions, ImageEffectOptions {
  readonly x?: number
  readonly y?: number
  readonly size?: number
  readonly life?: number
  readonly power?: number
  /** Launch as a rising shell that bursts into the picture. Default true. */
  readonly rise?: boolean
}

export interface FireworksHandle {
  /** Fire one built-in firework. Throws a clear error if the spec is invalid. */
  launch(spec?: LaunchSpecInput): void
  /** Fire a custom break pattern at a point. */
  launchEffect(effect: FireworkEffect, options?: LaunchEffectOptions): void
  /** Fireworkify an image/SVG URL (or raw SVG string): the break paints it. */
  launchImage(source: string, options?: LaunchImageOptions): Promise<void>
  /** Resume the show. */
  start(): void
  /** Freeze the show. */
  stop(): void
  /** Clear all particles. */
  clear(): void
  /** Patch live options (validated). */
  setOptions(patch: FireworksConfigInput): void
  /** Fire a timed grand-finale barrage (non-blocking). */
  finale(options?: FinaleOptions): void
  /** Read engine stats (fps, particle count, …). */
  stats(): EngineStats
  isRunning(): boolean
  /** Tear everything down and release resources. */
  destroy(): void
  /** Escape hatch: the underlying Effect engine for advanced composition. */
  readonly engine: PyroEngine
}

const asError = (value: unknown): Error => {
  if (value instanceof Error) return value
  return new Error(String(value))
}

const runSyncOrThrow = <A, E>(effect: Effect.Effect<A, E>): A => {
  const exit = Effect.runSyncExit(effect)
  if (Exit.isSuccess(exit)) return exit.value
  throw asError(Cause.squash(exit.cause))
}

export const createFireworks = (
  canvas: HTMLCanvasElement,
  options?: FireworksConfigInput,
): FireworksHandle => {
  const scope = Effect.runSync(Scope.make())
  // If construction fails, close the scope so any already-acquired resources are
  // released before the error propagates.
  const engine = runSyncOrThrow(
    makeEngine(canvas, options).pipe(
      Scope.extend(scope),
      Effect.tapErrorCause(() => Scope.close(scope, Exit.void)),
    ),
  )

  return {
    engine,
    launch: (spec) => runSyncOrThrow(engine.launch(spec)),
    launchEffect: (effect, opts) =>
      Effect.runSync(
        engine.launchEffect(effect, opts?.x ?? 0.5, opts?.y ?? 0.4, opts, opts?.rise ?? false),
      ),
    launchImage: async (source, opts) => {
      const points = await sampleImage(source, opts ?? {})
      const effect = imageEffect(points, opts ?? {})
      Effect.runSync(
        engine.launchEffect(
          effect,
          opts?.x ?? 0.5,
          opts?.y ?? 0.45,
          { count: points.length, size: opts?.size, life: opts?.life, power: opts?.power },
          opts?.rise ?? true,
        ),
      )
    },
    start: () => Effect.runSync(engine.start),
    stop: () => Effect.runSync(engine.stop),
    clear: () => Effect.runSync(engine.clear),
    setOptions: (patch) => runSyncOrThrow(engine.setConfig(patch)),
    finale: (opts) => {
      Effect.runSync(engine.fork(engine.finale(opts)))
    },
    stats: () => Effect.runSync(engine.stats),
    isRunning: () => Effect.runSync(engine.isRunning),
    destroy: () => {
      // Stop ticking immediately, then tear down asynchronously.
      Effect.runSync(engine.stop)
      Effect.runFork(Scope.close(scope, Exit.void))
    },
  }
}
