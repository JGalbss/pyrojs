import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"

// Trailing patterns — long-lived streaking stars shaped mostly by gravity.

const TRAIL = ParticleFlag.Glow | ParticleFlag.Streak

/** Long golden tendrils that rise, stall, and droop like a weeping willow. */
export const willow: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.55 * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed - ctx.power * 0.1,
      life: ctx.life * 2.2 * jitter(ctx.rng, 0.18),
      size: ctx.size * 0.9,
      drag: ctx.drag * 0.35,
      color: pickColor(ctx),
      flags: TRAIL,
    })
  }
}

/** Thick fronds arcing up and over — a palm tree shell. */
export const palm: FireworkEffect = (emit, ctx) => {
  const fronds = Math.max(6, Math.round(ctx.count * 0.3))
  for (let i = 0; i < fronds; i++) {
    const angle = (i / fronds) * TAU
    const spread = angle * 0.15
    const speed = ctx.power * (1.0 + 0.25 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle + spread) * speed,
      vy: Math.sin(angle + spread) * speed - ctx.power * 0.25,
      life: ctx.life * 1.7 * jitter(ctx.rng, 0.12),
      size: ctx.size * 1.7,
      drag: ctx.drag * 0.5,
      color: pickColor(ctx),
      flags: TRAIL,
    })
  }
}

/** A downward waterfall of sparks. */
export const horsetail: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const angle = TAU * 0.25 + (ctx.rng.next() - 0.5) * 1.1
    const speed = ctx.power * (0.4 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed * 0.6,
      vy: Math.abs(Math.sin(angle)) * speed * 0.5 + ctx.power * 0.1,
      life: ctx.life * 1.9 * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag * 0.4,
      color: pickColor(ctx),
      flags: TRAIL,
    })
  }
}

/** A handful of fast, bright comets streaking outward. */
export const comet: FireworkEffect = (emit, ctx) => {
  const count = Math.max(5, Math.round(ctx.count * 0.18))
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (1.4 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 1.5 * jitter(ctx.rng, 0.15),
      size: ctx.size * 1.8,
      drag: ctx.drag * 0.3,
      color: pickColor(ctx),
      flags: TRAIL,
    })
  }
}

/** Thin, straight legs that shoot out and snap dark — a spider. */
export const spider: FireworkEffect = (emit, ctx) => {
  const legs = Math.max(10, Math.round(ctx.count * 0.5))
  const color = pickColor(ctx)
  for (let i = 0; i < legs; i++) {
    const angle = (i / legs) * TAU + (ctx.rng.next() - 0.5) * 0.1
    const speed = ctx.power * (1.3 + 0.2 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 0.9 * jitter(ctx.rng, 0.1),
      size: ctx.size * 0.8,
      drag: ctx.drag * 0.15,
      color,
      flags: ParticleFlag.Streak,
    })
  }
}
