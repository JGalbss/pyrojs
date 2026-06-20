// pyrojs — a fireworks engine for the web.
//
// Layered API, one engine:
//   • createFireworks(canvas, options)  — easy, imperative, batteries included
//   • makeEngine(canvas, options)       — the Effect-native engine (returns an Effect)
//   • pyrojs/react                      — <Fireworks/> + useFireworks
//   • pyrojs/show                       — the Effect choreography DSL
//
// Effect is the backbone (Schema config, typed errors, Scope/Ref/Schedule
// lifecycle). The per-frame particle kernel is plain typed-array TS for speed.

// ---- Easy / imperative API ----
export { createFireworks, type FireworksHandle } from "./core/runtime.js"

// ---- Effect-native engine ----
export {
  makeEngine,
  type PyroEngine,
  type EngineStats,
  type FinaleOptions,
} from "./core/engine.js"

// ---- Configuration (Schema-validated) ----
export {
  FireworksConfigSchema,
  LaunchSpecSchema,
  ColorString,
  decodeFireworksConfig,
  decodeLaunchSpec,
  intensityPresets,
  FIREWORK_TYPES,
  INTENSITIES,
} from "./core/config.js"
export type {
  FireworksConfig,
  FireworksConfigInput,
  LaunchSpec,
  LaunchSpecInput,
  FireworkType,
  Intensity,
  IntensityPreset,
  Interval,
  LaunchArea,
} from "./core/config.js"

// ---- Typed error channels ----
export {
  ConfigError,
  CanvasError,
  RenderError,
  ShowError,
  type PyroError,
} from "./core/errors.js"

// ---- Presets & palettes ----
export { presets, type PresetName } from "./core/presets.js"
export { palettes, type PaletteName } from "./engine/palettes.js"

// ---- Effect catalog (compose your own firework types) ----
export { effectRegistry, getEffect } from "./engine/effects/registry.js"
export type { FireworkEffect, BurstContext, Emitter, StarSpec } from "./engine/emitter.js"
export { pickColor, jitter } from "./engine/emitter.js"

// ---- Color utilities ----
export {
  parseColor,
  tryParseColor,
  hslToRgb,
  lerpColor,
  rgbToHex,
  rgbToCss,
  packRgb,
  spectrum,
  type Rgb,
} from "./engine/color.js"

// ---- Low-level engine (power users / custom renderers) ----
export { Particles, ParticleFlag, type ParticleInit } from "./engine/particles.js"
export { stepParticles, defaultForces, type Forces } from "./engine/kernel.js"
export {
  CanvasRenderer,
  defaultRenderOptions,
  type Renderer,
  type RenderOptions,
} from "./engine/renderer.js"
export { Simulation, type SimStats } from "./engine/simulation.js"
export { Random, createRandom } from "./engine/math/rng.js"
export { easings, applyEasing, type EasingName, type EasingFn } from "./engine/math/easing.js"
