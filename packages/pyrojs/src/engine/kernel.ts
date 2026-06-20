import type { Particles } from "./particles.js"
import type { Random } from "./math/rng.js"

// The per-frame physics kernel. Pure Newtonian integration over the SoA store:
// air drag (exponential damping), gravity, wind, and optional turbulence, then
// life decay with swap-remove on death. Hosted by the Effect layer inside a
// single Effect.sync per frame.

export interface Forces {
  /** Downward acceleration in px/s² (canvas y grows downward). */
  readonly gravity: number
  /** Horizontal acceleration in px/s² (positive = rightward). */
  readonly wind: number
  /** Random jitter acceleration magnitude in px/s² (flicker/flutter). */
  readonly turbulence: number
}

export const defaultForces: Forces = {
  gravity: 60,
  wind: 0,
  turbulence: 0,
}

// Exponential damping keeps drag stable regardless of frame rate.
const dampingFactor = (drag: number, dt: number): number => Math.exp(-drag * dt)

// A random-walk impulse: variance accumulates with time, so the per-step
// magnitude scales with sqrt(dt) to stay frame-rate independent.
const turbulent = (magnitude: number, dt: number, rng: Random): number => {
  if (magnitude <= 0) return 0
  return (rng.next() - 0.5) * magnitude * Math.sqrt(dt)
}

/**
 * Advance every live particle by `dt` seconds. Particles whose life reaches zero
 * are swap-removed in place, so iteration re-checks the slot a dead particle
 * vacated (the last live particle was moved into it).
 */
export const stepParticles = (
  particles: Particles,
  dt: number,
  forces: Forces,
  rng: Random,
): void => {
  const gravityStep = forces.gravity * dt
  const windStep = forces.wind * dt
  const turbulence = forces.turbulence

  let i = 0
  while (i < particles.count) {
    particles.ppx[i] = particles.px[i]
    particles.ppy[i] = particles.py[i]

    const damp = dampingFactor(particles.drag[i], dt)
    const vx =
      particles.vx[i] * damp + windStep + turbulent(turbulence, dt, rng)
    const vy =
      particles.vy[i] * damp + gravityStep + turbulent(turbulence, dt, rng)

    particles.px[i] += vx * dt
    particles.py[i] += vy * dt
    particles.vx[i] = vx
    particles.vy[i] = vy

    const life = particles.life[i] - dt
    if (life <= 0) {
      particles.kill(i)
      continue
    }
    particles.life[i] = life
    i += 1
  }
}
