// Low-level scalar math helpers shared across the engine hot path.
// Kept allocation-free and branch-light for performance.

export const PI: number = Math.PI
export const TAU: number = Math.PI * 2
export const HALF_PI: number = Math.PI / 2
export const DEG_TO_RAD: number = Math.PI / 180
export const RAD_TO_DEG: number = 180 / Math.PI

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1)

export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t

export const inverseLerp = (from: number, to: number, value: number): number => {
  const span = to - from
  if (Math.abs(span) < Number.EPSILON) return 0
  return (value - from) / span
}

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => lerp(outMin, outMax, inverseLerp(inMin, inMax, value))

export const degToRad = (degrees: number): number => degrees * DEG_TO_RAD

export const radToDeg = (radians: number): number => radians * RAD_TO_DEG

export const approxEqual = (a: number, b: number, epsilon: number = 1e-6): boolean =>
  Math.abs(a - b) <= epsilon

// Smoothly damp `t` toward 0..1 with a hermite curve. Used for soft fades.
export const smoothstep = (t: number): number => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
