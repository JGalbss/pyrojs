import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type BurstContext, type Emitter, type FireworkEffect } from "../emitter.js"

// Spherical / radial break patterns — the bread and butter of aerial shells.

/** The classic round burst: a dense sphere of glowing stars. */
export const peony: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.78 + 0.22 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * jitter(ctx.rng, 0.18),
      size: ctx.size,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** Like a peony but every star drags a sparkling tail. */
export const chrysanthemum: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.7 + 0.3 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * jitter(ctx.rng, 0.2) * 1.2,
      size: ctx.size * 1.05,
      drag: ctx.drag * 0.85,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** Fewer, larger, faster stars — a bold, wide break. */
export const dahlia: FireworkEffect = (emit, ctx) => {
  const count = Math.max(12, Math.round(ctx.count * 0.55))
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (1.15 + 0.3 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 1.15 * jitter(ctx.rng, 0.15),
      size: ctx.size * 1.6,
      drag: ctx.drag * 0.7,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** A flat ring of stars expanding outward. */
export const ring: FireworkEffect = (emit, ctx) => {
  const color = pickColor(ctx)
  for (let i = 0; i < ctx.count; i++) {
    const angle = (i / ctx.count) * TAU
    const speed = ctx.power * jitter(ctx.rng, 0.06)
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * jitter(ctx.rng, 0.12),
      size: ctx.size,
      drag: ctx.drag,
      color,
      flags: ParticleFlag.Glow,
    })
  }
}

/** Crackling, flickering stars — the "flitter" effect. */
export const strobe: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.5 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 1.3 * jitter(ctx.rng, 0.25),
      size: ctx.size * 0.85,
      drag: ctx.drag * 1.2,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle | ParticleFlag.NoFade,
    })
  }
}

/** A dense, long-hanging golden crown. */
export const brocade: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.4)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.6 + 0.35 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed - ctx.power * 0.05,
      life: ctx.life * 1.6 * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag * 0.6,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** A soft cloud of slow, twinkling sparkles. */
export const glitter: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.3)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.45 * ctx.rng.next()
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 1.4 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.7,
      drag: ctx.drag * 1.5,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
    })
  }
}

/** A single hard flash and report — the maroon/salute. */
export const salute: FireworkEffect = (emit: Emitter, ctx: BurstContext) => {
  const count = Math.round(ctx.count * 1.2)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (1.2 + 0.6 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.4 * jitter(ctx.rng, 0.2),
      size: ctx.size * 1.3,
      drag: ctx.drag * 2,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** A plain quick spherical burst — the simplest possible firework. */
export const burst: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.85 * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}
