import { Effect, Schema } from "effect"
import { tryParseColor } from "../engine/color.js"
import { ConfigError } from "./errors.js"

// All user-facing configuration is validated at the boundary with `Schema`.
// Nothing enters the engine without being decoded first, so the rest of the
// codebase works with fully-resolved, defaulted values and never re-checks input.

// ---------------------------------------------------------------------------
// Catalog of built-in firework types. The literal union is derived from this
// single source of truth and reused by the schema and the effect registry.
// ---------------------------------------------------------------------------
export const FIREWORK_TYPES = [
  "peony",
  "chrysanthemum",
  "willow",
  "palm",
  "ring",
  "crossette",
  "strobe",
  "brocade",
  "comet",
  "spider",
  "dahlia",
  "horsetail",
  "salute",
  "fountain",
  "heart",
  "star",
  "burst",
  "glitter",
] as const

export type FireworkType = (typeof FIREWORK_TYPES)[number]

export const INTENSITIES = ["calm", "normal", "energetic", "insane"] as const
export type Intensity = (typeof INTENSITIES)[number]

// ---------------------------------------------------------------------------
// Reusable refined number schemas.
// ---------------------------------------------------------------------------
const Unit = Schema.Number.pipe(Schema.between(0, 1))
const NonNegative = Schema.Number.pipe(Schema.greaterThanOrEqualTo(0))
const Positive = Schema.Number.pipe(Schema.greaterThan(0))
const PositiveInt = Schema.Number.pipe(Schema.int(), Schema.greaterThan(0))

/** A string that parses to a valid color (hex, rgb(), or hsl()). */
export const ColorString = Schema.String.pipe(
  Schema.filter((value) => tryParseColor(value) !== undefined, {
    identifier: "ColorString",
    message: () => "must be a valid CSS color (hex, rgb(), or hsl())",
  }),
)

const FireworkTypeName = Schema.Literal(...FIREWORK_TYPES)
const IntensityName = Schema.Literal(...INTENSITIES)

/** Either a fixed milliseconds value or an inclusive [min, max] range to sample. */
const Interval = Schema.Union(Positive, Schema.Tuple(NonNegative, Positive))
export type Interval = Schema.Schema.Type<typeof Interval>

export interface LaunchArea {
  readonly x: readonly [number, number]
  readonly y: readonly [number, number]
}

const DEFAULT_AUTOPLAY_TYPES: ReadonlyArray<FireworkType> = [
  "peony",
  "chrysanthemum",
  "willow",
  "ring",
  "crossette",
  "palm",
]

const DEFAULT_COLORS: ReadonlyArray<string> = [
  "#ffd700",
  "#ff4d4d",
  "#4dd2ff",
  "#b14dff",
  "#4dff88",
  "#ff7ad9",
]

// ---------------------------------------------------------------------------
// Instance configuration (the whole show).
// ---------------------------------------------------------------------------
export const FireworksConfigSchema = Schema.Struct({
  /** Preset that scales spawn rate, particle counts, and cadence. */
  intensity: Schema.optionalWith(IntensityName, { default: () => "normal" as const }),
  /** Run an autopilot show immediately. */
  autoplay: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  /** Delay between autopilot launches (ms), fixed or [min, max]. */
  launchInterval: Schema.optionalWith(Interval, { default: (): Interval => [600, 1400] }),
  /** Which firework types the autopilot draws from. */
  types: Schema.optionalWith(Schema.Array(FireworkTypeName), {
    default: () => DEFAULT_AUTOPLAY_TYPES,
  }),
  /** Palette the autopilot draws from. Use the exported palettes or your own. */
  colors: Schema.optionalWith(Schema.Array(ColorString), { default: () => DEFAULT_COLORS }),
  /** Downward acceleration in px/s². */
  gravity: Schema.optionalWith(Schema.Number, { default: () => 60 }),
  /** Horizontal acceleration in px/s². */
  wind: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  /** Random jitter acceleration in px/s². */
  turbulence: Schema.optionalWith(NonNegative, { default: () => 0 }),
  /** Trail persistence, 0 (crisp) … 1 (long smear). */
  trail: Schema.optionalWith(Unit, { default: () => 0.82 }),
  /** Global brightness multiplier. */
  brightness: Schema.optionalWith(NonNegative, { default: () => 1 }),
  /** Additive blending so overlapping sparks glow. */
  additive: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  /** Canvas background. "transparent" keeps it an overlay. */
  background: Schema.optionalWith(Schema.String, { default: () => "transparent" }),
  /** Normalized [min,max] region where shells burst (0,0 = top-left). */
  launchArea: Schema.optionalWith(
    Schema.Struct({ x: Schema.Tuple(Unit, Unit), y: Schema.Tuple(Unit, Unit) }),
    { default: (): LaunchArea => ({ x: [0.1, 0.9], y: [0.15, 0.5] }) },
  ),
  /** Pause the loop when the tab is hidden (Page Visibility API). */
  pauseWhenHidden: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  /** Multiplier on every particle's size. */
  particleScale: Schema.optionalWith(Positive, { default: () => 1 }),
  /** Time scale; 0.5 = slow-motion, 2 = double speed. */
  speed: Schema.optionalWith(Positive, { default: () => 1 }),
  /** Hard cap on simultaneous particles (memory ceiling). */
  maxParticles: Schema.optionalWith(PositiveInt, { default: () => 30_000 }),
  /** Seed for deterministic, reproducible shows. Omit for a random show. */
  seed: Schema.optional(Schema.Number),
  /** Honour `prefers-reduced-motion` by toning the show down. */
  respectReducedMotion: Schema.optionalWith(Schema.Boolean, { default: () => true }),
})

export type FireworksConfig = Schema.Schema.Type<typeof FireworksConfigSchema>
export type FireworksConfigInput = Schema.Schema.Encoded<typeof FireworksConfigSchema>

// ---------------------------------------------------------------------------
// Per-launch specification (one shell).
// ---------------------------------------------------------------------------
export const LaunchSpecSchema = Schema.Struct({
  /** Which firework to fire. */
  type: Schema.optionalWith(FireworkTypeName, { default: () => "peony" as const }),
  /** Burst origin X in normalized [0,1] canvas space. Omit to randomize. */
  x: Schema.optional(Unit),
  /** Burst origin Y in normalized [0,1] canvas space. Omit to randomize. */
  y: Schema.optional(Unit),
  /** Override colors for this shell. */
  colors: Schema.optional(Schema.Array(ColorString)),
  /** Number of stars in the break. */
  count: Schema.optional(PositiveInt),
  /** Burst energy multiplier (spread radius / velocity). */
  power: Schema.optional(Positive),
  /** Star size multiplier. */
  size: Schema.optional(Positive),
  /** Star lifetime in seconds. */
  life: Schema.optional(Positive),
  /** Launch from the ground with a rising shell instead of bursting in place. */
  rise: Schema.optional(Schema.Boolean),
})

export type LaunchSpec = Schema.Schema.Type<typeof LaunchSpecSchema>
export type LaunchSpecInput = Schema.Schema.Encoded<typeof LaunchSpecSchema>

// ---------------------------------------------------------------------------
// Decoders — the only sanctioned way in. They surface failures as tagged
// `ConfigError`s on the Effect error channel.
// ---------------------------------------------------------------------------
// Codecs are compiled once at module scope, not rebuilt on every call.
const decodeConfigCodec = Schema.decodeUnknown(FireworksConfigSchema)
const decodeLaunchCodec = Schema.decodeUnknown(LaunchSpecSchema)

export const decodeFireworksConfig = (
  input: unknown,
): Effect.Effect<FireworksConfig, ConfigError> =>
  decodeConfigCodec(input ?? {}).pipe(
    Effect.mapError(
      (cause) => new ConfigError({ message: "Invalid fireworks config", cause }),
    ),
  )

export const decodeLaunchSpec = (
  input: unknown,
): Effect.Effect<LaunchSpec, ConfigError> =>
  decodeLaunchCodec(input ?? {}).pipe(
    Effect.mapError(
      (cause) => new ConfigError({ message: "Invalid launch spec", cause }),
    ),
  )

// ---------------------------------------------------------------------------
// Intensity presets — a lookup map (no branching) applied after decode.
// ---------------------------------------------------------------------------
export interface IntensityPreset {
  readonly countScale: number
  readonly rateScale: number
  readonly powerScale: number
}

export const intensityPresets: Record<Intensity, IntensityPreset> = {
  calm: { countScale: 0.6, rateScale: 0.5, powerScale: 0.85 },
  normal: { countScale: 1, rateScale: 1, powerScale: 1 },
  energetic: { countScale: 1.5, rateScale: 1.8, powerScale: 1.15 },
  insane: { countScale: 2.6, rateScale: 3.5, powerScale: 1.35 },
}
