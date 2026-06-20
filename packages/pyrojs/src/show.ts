import { Duration, Effect, Schedule } from "effect"
import { createFireworks, type FireworksHandle } from "./core/runtime.js"
import type { PyroEngine, FinaleOptions } from "./core/engine.js"
import type { FireworksConfigInput, LaunchSpecInput } from "./core/config.js"
import type { ConfigError } from "./core/errors.js"

export type { ConfigError } from "./core/errors.js"

// The choreography DSL. A `Show` is a small, composable description of timed
// launches that compiles to an Effect program. This is where the Effect runtime
// lives — Schedule for repetition, sleeps for timing, structured concurrency for
// simultaneous salvos and overlapping timelines. The hot render loop never
// appears here; a Show only ever asks the engine to launch shells.

export interface Show {
  readonly run: (engine: PyroEngine) => Effect.Effect<void, ConfigError>
}

// ---------------------------------------------------------------------------
// Friendly time inputs: "2s", "500ms", a raw millisecond number, or a Duration.
// ---------------------------------------------------------------------------
export type ShowTime = `${number}s` | `${number}ms` | number | Duration.Duration

const COMPACT_TIME = /^(\d+(?:\.\d+)?)(ms|s)$/
const compactUnit: Record<string, (value: number) => Duration.Duration> = {
  ms: Duration.millis,
  s: Duration.seconds,
}

const toDuration = (time: ShowTime): Duration.Duration => {
  if (typeof time === "number") return Duration.millis(time)
  if (typeof time !== "string") return time
  const match = COMPACT_TIME.exec(time.trim())
  if (match === null) return Duration.seconds(0)
  return compactUnit[match[2]](Number(match[1]))
}

// ---------------------------------------------------------------------------
// Spec builders — terse, typed shorthands that produce a LaunchSpecInput.
//   peony({ colors: ['#ffd700'] })  ->  { type: 'peony', colors: [...] }
// ---------------------------------------------------------------------------
export type SpecOptions = Omit<LaunchSpecInput, "type">
export type SpecBuilder = (options?: SpecOptions) => LaunchSpecInput

const builder =
  (type: NonNullable<LaunchSpecInput["type"]>): SpecBuilder =>
  (options) => ({ type, ...options })

export const peony: SpecBuilder = builder("peony")
export const chrysanthemum: SpecBuilder = builder("chrysanthemum")
export const willow: SpecBuilder = builder("willow")
export const palm: SpecBuilder = builder("palm")
export const ring: SpecBuilder = builder("ring")
export const crossette: SpecBuilder = builder("crossette")
export const strobe: SpecBuilder = builder("strobe")
export const brocade: SpecBuilder = builder("brocade")
export const comet: SpecBuilder = builder("comet")
export const spider: SpecBuilder = builder("spider")
export const dahlia: SpecBuilder = builder("dahlia")
export const horsetail: SpecBuilder = builder("horsetail")
export const salute: SpecBuilder = builder("salute")
export const fountain: SpecBuilder = builder("fountain")
export const heart: SpecBuilder = builder("heart")
export const star: SpecBuilder = builder("star")
export const burstShell: SpecBuilder = builder("burst")
export const glitter: SpecBuilder = builder("glitter")

// ---------------------------------------------------------------------------
// Show combinators.
// ---------------------------------------------------------------------------

/** Fire a single shell. */
export const fire = (spec: LaunchSpecInput): Show => ({
  run: (engine) => engine.launch(spec),
})

// A launch is an instantaneous state mutation, so firing a volley sequentially
// still lands every shell on the same render frame — no fiber-per-shell needed.
const fireEach = (
  engine: PyroEngine,
  specs: ReadonlyArray<LaunchSpecInput>,
): Effect.Effect<void, ConfigError> =>
  Effect.forEach(specs, (spec) => engine.launch(spec), { concurrency: 1, discard: true })

/** Fire several different shells at the same instant. */
export const burst = (specs: ReadonlyArray<LaunchSpecInput>): Show => ({
  run: (engine) => fireEach(engine, specs),
})

/** Fire `count` copies of one shell simultaneously (a volley). */
export const salvo = (count: number, spec: LaunchSpecInput): Show => ({
  run: (engine) => fireEach(engine, Array.from({ length: Math.max(1, count) }, () => spec)),
})

/** Pause for a duration ("2s", "500ms", 500, Duration.seconds(2)). */
export const wait = (duration: ShowTime): Show => ({
  run: () => Effect.sleep(toDuration(duration)),
})

/** Run shows one after another (each completes before the next begins). */
export const sequence = (...shows: ReadonlyArray<Show>): Show => ({
  run: (engine) => Effect.forEach(shows, (show) => show.run(engine), { concurrency: 1, discard: true }),
})

/** Run shows all at once. Unbounded by design: composed shows contain their own
 *  timing (sleeps/timelines) and must start together. */
export const all = (...shows: ReadonlyArray<Show>): Show => ({
  run: (engine) =>
    Effect.all(
      shows.map((show) => show.run(engine)),
      { concurrency: "unbounded", discard: true },
    ),
})

export interface RepeatOptions {
  readonly times: number
  readonly every: ShowTime
}

/** Repeat a show `times` times, spaced by `every`. */
export const repeat = (options: RepeatOptions, item: Show): Show => ({
  run: (engine) =>
    item.run(engine).pipe(
      Effect.repeat(
        Schedule.spaced(toDuration(options.every)).pipe(
          Schedule.intersect(Schedule.recurs(Math.max(0, options.times - 1))),
        ),
      ),
      Effect.asVoid,
    ),
})

export interface Cue {
  readonly offset: ShowTime
  readonly show: Show
}

/** Schedule a show to begin at an absolute offset from the timeline start. */
export const at = (offset: ShowTime, show: Show): Cue => ({ offset, show })

/** A choreographed timeline: every cue fires at its own offset, concurrently.
 *  Unbounded by design — each cue must start its own countdown immediately. */
export const timeline = (...cues: ReadonlyArray<Cue>): Show => ({
  run: (engine) =>
    Effect.all(
      cues.map((cue) =>
        Effect.sleep(toDuration(cue.offset)).pipe(Effect.zipRight(cue.show.run(engine))),
      ),
      { concurrency: "unbounded", discard: true },
    ),
})

/** A grand-finale barrage. */
export const finale = (options?: FinaleOptions): Show => ({
  run: (engine) => engine.finale(options),
})

// ---------------------------------------------------------------------------
// Running shows.
// ---------------------------------------------------------------------------

/** Run a show against an existing Effect engine. */
export const runShow = (engine: PyroEngine, show: Show): Effect.Effect<void, ConfigError> =>
  show.run(engine)

/**
 * Mount a canvas, run a show, and return the handle (call `destroy()` to stop).
 * Autopilot is off by default so the show is exactly what you scripted.
 */
export const playShow = (
  canvas: HTMLCanvasElement,
  show: Show,
  config?: FireworksConfigInput,
): FireworksHandle => {
  const handle = createFireworks(canvas, { autoplay: false, ...config })
  Effect.runFork(show.run(handle.engine))
  return handle
}
