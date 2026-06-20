import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"

// Motion / spinner effects. The unifying physics here is tangential velocity:
// rotating the radial direction by +PI/2 turns "outward" into "around", which is
// what gives wheels, buzzers and rising spinners their swirl. Streak trails make
// that rotation legible as arcs of light.

const SPIN_GLOW = ParticleFlag.Glow | ParticleFlag.Streak
const BUZZ = ParticleFlag.Glow | ParticleFlag.Streak | ParticleFlag.Twinkle

/** Spinning sparks that climb: tangential swirl plus a strong upward bias. */
export const tourbillion: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const a = ctx.rng.angle()
    const t = a + Math.PI / 2
    const speed = ctx.power * (0.55 + 0.45 * ctx.rng.next())
    const vy = Math.sin(t) * speed - ctx.power * 0.3
    emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(t) * speed, vy, life: ctx.life * jitter(ctx.rng, 0.2), size: ctx.size, drag: ctx.drag, color: pickColor(ctx), flags: SPIN_GLOW })
  }
}

/** Wandering snake trails: a handful of streamers, each gently curving aside. */
export const serpent: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 14; i++) {
    const a = ctx.rng.angle() + ctx.rng.gaussian(0, 0.35)
    const speed = ctx.power * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: ctx.life * jitter(ctx.rng, 0.25), size: ctx.size, drag: ctx.drag * 0.5, color: pickColor(ctx), flags: BUZZ })
  }
}

/** Erratic spinning buzzers: tangential darting with a flickering twinkle. */
export const hummer: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const a = ctx.rng.angle()
    const t = a + Math.PI / 2 + ctx.rng.gaussian(0, 0.5)
    const speed = ctx.power * (0.7 + 0.6 * ctx.rng.next())
    emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(t) * speed, vy: Math.sin(t) * speed, life: ctx.life * (0.45 * jitter(ctx.rng, 0.3)), size: ctx.size, drag: ctx.drag, color: pickColor(ctx), flags: BUZZ })
  }
}

/** A few hard-spinning stars that whirl then fall, with a slight lift. */
export const helicopter: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 8; i++) {
    const a = ctx.rng.angle()
    const t = a + Math.PI / 2
    const speed = ctx.power * (0.85 + 0.3 * ctx.rng.next())
    const vy = Math.sin(t) * speed - ctx.power * 0.15
    emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(t) * speed, vy, life: ctx.life * jitter(ctx.rng, 0.2), size: ctx.size, drag: ctx.drag, color: pickColor(ctx), flags: SPIN_GLOW })
  }
}

/** A rising, spinning ring: evenly spaced stars all swirling and climbing. */
export const girandola: FireworkEffect = (emit, ctx) => {
  const n = Math.max(1, ctx.count)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU
    const t = a + Math.PI / 2
    const speed = ctx.power * (0.85 + 0.15 * ctx.rng.next())
    const vy = Math.sin(t) * speed - ctx.power * 0.25
    emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(t) * speed, vy, life: ctx.life * jitter(ctx.rng, 0.15), size: ctx.size, drag: ctx.drag, color: pickColor(ctx), flags: SPIN_GLOW })
  }
}

/** A Catherine wheel: spokes that sweep outward along curving arms. */
export const wheel: FireworkEffect = (emit, ctx) => {
  const arms = 6
  const perArm = Math.max(1, Math.floor(ctx.count / arms))
  for (let arm = 0; arm < arms; arm++) {
    const base = (arm / arms) * TAU
    for (let i = 0; i < perArm; i++) {
      const t = (i + 1) / perArm
      const a = base + t * 1.6
      const speed = ctx.power * (0.25 + 0.75 * t)
      emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: ctx.life * jitter(ctx.rng, 0.15), size: ctx.size, drag: ctx.drag, color: pickColor(ctx), flags: SPIN_GLOW })
    }
  }
}

/** A pinwheel: fewer, faster-sweeping arms than the Catherine wheel. */
export const pinwheel: FireworkEffect = (emit, ctx) => {
  const arms = 4
  const perArm = Math.max(1, Math.floor(ctx.count / arms))
  for (let arm = 0; arm < arms; arm++) {
    const base = (arm / arms) * TAU
    for (let i = 0; i < perArm; i++) {
      const t = (i + 1) / perArm
      const a = base + t * 2.2
      const speed = ctx.power * (0.3 + 0.9 * t)
      emit.emit({ x: ctx.x, y: ctx.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: ctx.life * jitter(ctx.rng, 0.12), size: ctx.size * 1.15, drag: ctx.drag, color: pickColor(ctx), flags: SPIN_GLOW })
    }
  }
}

/** A slow descending canopy: stars sink steadily with high drag, glowing on. */
export const parachute: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 12; i++) {
    const vx = ctx.rng.gaussian(0, ctx.power * 0.08)
    const vy = ctx.power * (0.1 + 0.08 * ctx.rng.next())
    emit.emit({ x: ctx.x + ctx.rng.gaussian(0, ctx.size * 2), y: ctx.y, vx, vy, life: ctx.life * (1.6 * jitter(ctx.rng, 0.15)), size: ctx.size, drag: ctx.drag * 3, color: pickColor(ctx), flags: ParticleFlag.Glow | ParticleFlag.NoFade })
  }
}
