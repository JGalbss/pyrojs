import { Clock, Duration, Effect, Ref, Schedule, Scope } from "effect"
import { Simulation } from "../engine/simulation.js"
import type { Random } from "../engine/math/rng.js"
import {
  decodeFireworksConfig,
  decodeLaunchSpec,
  intensityPresets,
  type FireworksConfig,
  type FireworksConfigInput,
  type FireworkType,
  type Interval,
  type LaunchSpec,
  type LaunchSpecInput,
} from "./config.js"
import { acquireContext, observeSize, observeVisibility } from "./canvas.js"
import { requestFrame } from "./raf.js"
import type { CanvasError, ConfigError } from "./errors.js"

// The Effect-native engine. Effect owns the entire lifecycle: the canvas context
// and DOM observers are scoped resources, the render loop and autopilot are
// forked fibers tied to the scope, and all state lives in Refs. Only the
// per-frame numeric work is delegated to the plain-TS simulation via Effect.sync.

export interface EngineStats {
  readonly particles: number
  readonly capacity: number
  readonly shells: number
  readonly running: boolean
}

export interface FinaleOptions {
  readonly durationMs?: number
  readonly shellsPerSecond?: number
  readonly types?: ReadonlyArray<FireworkType>
}

export interface PyroEngine {
  /** Fire a single firework (validated; fails with ConfigError on bad input). */
  readonly launch: (spec?: LaunchSpecInput) => Effect.Effect<void, ConfigError>
  /** Resume the render loop and autopilot. */
  readonly start: Effect.Effect<void>
  /** Freeze the render loop (particles stop advancing). */
  readonly stop: Effect.Effect<void>
  /** Remove all live particles and in-flight shells. */
  readonly clear: Effect.Effect<void>
  /** Patch the live configuration (re-validated). */
  readonly setConfig: (patch: FireworksConfigInput) => Effect.Effect<void, ConfigError>
  /** Fire a timed barrage. */
  readonly finale: (options?: FinaleOptions) => Effect.Effect<void>
  /** Snapshot of engine state. */
  readonly stats: Effect.Effect<EngineStats>
  readonly isRunning: Effect.Effect<boolean>
}

const MAX_DT = 0.05

const clampDt = (dt: number): number => {
  if (dt < 0) return 0
  if (dt > MAX_DT) return MAX_DT
  return dt
}

const resolveSeed = (seed: number | undefined): Effect.Effect<number> => {
  if (seed !== undefined) return Effect.succeed(seed)
  return Clock.currentTimeMillis.pipe(Effect.map((ms) => ms >>> 0))
}

const intervalMs = (interval: Interval, rng: Random): number => {
  if (typeof interval === "number") return interval
  return rng.range(interval[0], interval[1])
}

const sampleInterval = (config: FireworksConfig, rng: Random): number => {
  const preset = intensityPresets[config.intensity]
  return intervalMs(config.launchInterval, rng) / preset.rateScale
}

const autoSpec = (
  config: FireworksConfig,
  types: ReadonlyArray<FireworkType>,
  rng: Random,
): LaunchSpec => ({
  type: rng.pick(types),
  x: rng.range(config.launchArea.x[0], config.launchArea.x[1]),
  y: rng.range(config.launchArea.y[0], config.launchArea.y[1]),
  rise: true,
})

export const makeEngine: (
  canvas: HTMLCanvasElement,
  configInput?: FireworksConfigInput,
) => Effect.Effect<PyroEngine, ConfigError | CanvasError, Scope.Scope> = Effect.fn(
  "pyro.makeEngine",
)(function* (canvas: HTMLCanvasElement, configInput?: FireworksConfigInput) {
  const config = yield* decodeFireworksConfig(configInput)
    const ctx = yield* acquireContext(canvas)
    const seed = yield* resolveSeed(config.seed)
    const sim = new Simulation(ctx, config, seed)

    const configRef = yield* Ref.make(config)
    const running = yield* Ref.make(config.autoplay)
    const lastTime = yield* Ref.make(0)
    // The document's visibility is external DOM state; mirror it into a plain
    // holder so the event callback stays a pure side effect (no Effect runs
    // detached inside it) and the loop can read it directly.
    const visibility = { hidden: false }

    // Observe the canvas's own layout box so it works whether it's a full-screen
    // overlay (CSS 100%) or embedded in a sized container.
    yield* observeSize(canvas, (width, height, dpr) => sim.resize(width, height, dpr))
    yield* observeVisibility((isHidden) => {
      visibility.hidden = isHidden
    })

    const frame = Effect.gen(function* () {
      const now = yield* requestFrame
      const prev = yield* Ref.getAndSet(lastTime, now)
      const cfg = yield* Ref.get(configRef)
      const isRunning = yield* Ref.get(running)
      const paused = !isRunning || (visibility.hidden && cfg.pauseWhenHidden)
      if (paused) return
      const dt = clampDt((now - prev) / 1000) * cfg.speed
      yield* Effect.sync(() => sim.tick(dt, now / 1000))
    })
    yield* Effect.forkScoped(Effect.forever(frame))

    const autopilot = Effect.gen(function* () {
      const cfg = yield* Ref.get(configRef)
      const isRunning = yield* Ref.get(running)
      if (isRunning && cfg.autoplay) {
        yield* Effect.sync(() => sim.launch(autoSpec(cfg, cfg.types, sim.rng)))
      }
      yield* Effect.sleep(Duration.millis(sampleInterval(cfg, sim.rng)))
    })
    yield* Effect.forkScoped(Effect.forever(autopilot))

    yield* Effect.addFinalizer(() => Effect.sync(() => sim.dispose()))

    const launch = (specInput?: LaunchSpecInput): Effect.Effect<void, ConfigError> =>
      decodeLaunchSpec(specInput).pipe(
        Effect.flatMap((spec) => Effect.sync(() => sim.launch(spec))),
      )

    const setConfig = Effect.fn("pyro.setConfig")(function* (patch: FireworksConfigInput) {
      const current = yield* Ref.get(configRef)
      const next = yield* decodeFireworksConfig({ ...current, ...patch })
      yield* Ref.set(configRef, next)
      yield* Effect.sync(() => sim.configure(next))
    })

    const finale = Effect.fn("pyro.finale")(function* (options?: FinaleOptions) {
      const cfg = yield* Ref.get(configRef)
      const shellsPerSecond = options?.shellsPerSecond ?? 8
      const durationMs = options?.durationMs ?? 6000
      const shells = Math.max(1, Math.round((durationMs / 1000) * shellsPerSecond))
      const types = options?.types ?? cfg.types
      const fireOne = Effect.sync(() => sim.launch(autoSpec(cfg, types, sim.rng)))
      yield* fireOne.pipe(
        Effect.repeat(
          Schedule.spaced(Duration.millis(1000 / shellsPerSecond)).pipe(
            Schedule.intersect(Schedule.recurs(shells - 1)),
          ),
        ),
        Effect.asVoid,
      )
    })

    const stats: Effect.Effect<EngineStats> = Effect.gen(function* () {
      const snapshot = sim.stats()
      const isRunning = yield* Ref.get(running)
      return {
        particles: snapshot.particles,
        capacity: snapshot.capacity,
        shells: snapshot.shells,
        running: isRunning,
      }
    })

    return {
      launch,
      start: Ref.set(running, true),
      stop: Ref.set(running, false),
      clear: Effect.sync(() => sim.clear()),
      setConfig,
      finale,
      stats,
      isRunning: Ref.get(running),
    }
  })
