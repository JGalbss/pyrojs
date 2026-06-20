import { clamp01 } from "./scalar.js"

// Easing functions operate on a normalized time t in [0, 1] and return the
// eased progress. Used for fades, gravity ramps, and show timeline curves.
// Each is a small pure function; branching uses guard clauses, never ternaries.

export type EasingFn = (t: number) => number

export const linear: EasingFn = (t) => t

export const easeInQuad: EasingFn = (t) => t * t
export const easeOutQuad: EasingFn = (t) => 1 - (1 - t) * (1 - t)
export const easeInOutQuad: EasingFn = (t) => {
  if (t < 0.5) return 2 * t * t
  return 1 - Math.pow(-2 * t + 2, 2) / 2
}

export const easeInCubic: EasingFn = (t) => t * t * t
export const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic: EasingFn = (t) => {
  if (t < 0.5) return 4 * t * t * t
  return 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const easeOutQuart: EasingFn = (t) => 1 - Math.pow(1 - t, 4)
export const easeInQuart: EasingFn = (t) => t * t * t * t

export const easeInSine: EasingFn = (t) => 1 - Math.cos((t * Math.PI) / 2)
export const easeOutSine: EasingFn = (t) => Math.sin((t * Math.PI) / 2)
export const easeInOutSine: EasingFn = (t) => -(Math.cos(Math.PI * t) - 1) / 2

export const easeOutExpo: EasingFn = (t) => {
  if (t >= 1) return 1
  return 1 - Math.pow(2, -10 * t)
}
export const easeInExpo: EasingFn = (t) => {
  if (t <= 0) return 0
  return Math.pow(2, 10 * t - 10)
}

const BACK_C1 = 1.70158
const BACK_C3 = BACK_C1 + 1
export const easeOutBack: EasingFn = (t) => {
  const x = t - 1
  return 1 + BACK_C3 * x * x * x + BACK_C1 * x * x
}

const BOUNCE_N = 7.5625
const BOUNCE_D = 2.75
export const easeOutBounce: EasingFn = (t) => {
  if (t < 1 / BOUNCE_D) return BOUNCE_N * t * t
  if (t < 2 / BOUNCE_D) {
    const x = t - 1.5 / BOUNCE_D
    return BOUNCE_N * x * x + 0.75
  }
  if (t < 2.5 / BOUNCE_D) {
    const x = t - 2.25 / BOUNCE_D
    return BOUNCE_N * x * x + 0.9375
  }
  const x = t - 2.625 / BOUNCE_D
  return BOUNCE_N * x * x + 0.984375
}

export const easings = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInQuart,
  easeOutQuart,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeOutBack,
  easeOutBounce,
} as const

export type EasingName = keyof typeof easings

export const applyEasing = (name: EasingName, t: number): number =>
  easings[name](clamp01(t))
