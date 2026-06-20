import { Cause, Effect, Exit, Scope } from "effect"
import {
  makeEngine,
  type EngineStats,
  type FinaleOptions,
  type PyroEngine,
} from "./engine.js"
import type { FireworksConfigInput, LaunchSpecInput } from "./config.js"

// Imperative facade over the Effect engine. Vanilla users never touch an Effect
// value: construction runs the program under a long-lived Scope, and each method
// runs its (synchronous) Effect at the boundary, rethrowing tagged errors as
// ordinary exceptions. `destroy()` closes the scope, which interrupts the forked
// fibers and runs every finalizer (renderer + observers).

export interface FireworksHandle {
  /** Fire one firework. Throws a clear error if the spec is invalid. */
  launch(spec?: LaunchSpecInput): void
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
  /** Read engine stats. */
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
  const engine = runSyncOrThrow(makeEngine(canvas, options).pipe(Scope.extend(scope)))

  return {
    engine,
    launch: (spec) => runSyncOrThrow(engine.launch(spec)),
    start: () => Effect.runSync(engine.start),
    stop: () => Effect.runSync(engine.stop),
    clear: () => Effect.runSync(engine.clear),
    setOptions: (patch) => runSyncOrThrow(engine.setConfig(patch)),
    finale: (opts) => {
      Effect.runFork(engine.finale(opts))
    },
    stats: () => Effect.runSync(engine.stats),
    isRunning: () => Effect.runSync(engine.isRunning),
    destroy: () => {
      Effect.runFork(Scope.close(scope, Exit.void))
    },
  }
}
