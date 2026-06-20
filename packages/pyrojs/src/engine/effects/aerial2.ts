import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type BurstContext, type FireworkEffect } from "../emitter.js"
import type { Rgb } from "../color.js"

// Aerial-break patterns — large, expressive shell bursts.

const GLITTER = ParticleFlag.Glow | ParticleFlag.Streak | ParticleFlag.Twinkle
const FROND = ParticleFlag.Glow | ParticleFlag.Streak
const FLUTTER = ParticleFlag.Glow | ParticleFlag.Twinkle

/** Picks a second color distinct from the first when the palette allows it. */
const pickContrast = (ctx: BurstContext, avoid: Rgb): Rgb => {
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = pickColor(ctx)
    if (candidate.r !== avoid.r || candidate.g !== avoid.g || candidate.b !== avoid.b) {
      return candidate
    }
  }
  return pickColor(ctx)
}

/** Dense golden glittering willow — rises, stalls, then weeps in a shimmer. */
export const nishiki: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.5)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.6 * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed - ctx.power * 0.08,
      life: ctx.life * 2.5 * jitter(ctx.rng, 0.2),
      size: ctx.size * 0.95,
      drag: ctx.drag * 0.3,
      color: pickColor(ctx),
      flags: GLITTER,
    })
  }
}

/** Coconut palm — a few very thick, heavy fronds thrown wide and slightly up. */
export const coconut: FireworkEffect = (emit, ctx) => {
  const fronds = 7
  for (let i = 0; i < fronds; i++) {
    const angle = (i / fronds) * TAU
    const speed = ctx.power * (1.05 + 0.2 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - ctx.power * 0.18,
      life: ctx.life * 1.6 * jitter(ctx.rng, 0.1),
      size: ctx.size * 1.8,
      drag: ctx.drag * 0.45,
      color: pickColor(ctx),
      flags: FROND,
    })
  }
}

/** Ringed planet — a peony core wrapped by a flat, tight contrasting ring. */
export const saturn: FireworkEffect = (emit, ctx) => {
  const core = pickColor(ctx)
  const band = pickContrast(ctx, core)
  const sphere = Math.round(ctx.count * 0.7)
  for (let i = 0; i < sphere; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.7 * (0.78 + 0.22 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * jitter(ctx.rng, 0.15),
      size: ctx.size,
      drag: ctx.drag,
      color: core,
      flags: ParticleFlag.Glow,
    })
  }
  const ringCount = Math.round(ctx.count * 0.5)
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * TAU
    const speed = ctx.power * 1.1 * jitter(ctx.rng, 0.04)
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * jitter(ctx.rng, 0.08),
      size: ctx.size * 0.9,
      drag: ctx.drag,
      color: band,
      flags: ParticleFlag.Glow,
    })
  }
}

/** Crown of jewels — a fading peony around a bright, slow non-fading core. */
export const diadem: FireworkEffect = (emit, ctx) => {
  const crown = Math.round(ctx.count * 0.35)
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.8 + 0.2 * ctx.rng.next())
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
  for (let i = 0; i < crown; i++) {
    const dir = ctx.rng.inDisk(1)
    const speed = ctx.power * 0.25 * ctx.rng.next()
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.9 * jitter(ctx.rng, 0.12),
      size: ctx.size * 1.1,
      drag: ctx.drag * 1.3,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.NoFade,
    })
  }
}

/** An elegant tight peony where every star carries its own color. */
export const bouquet: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.8 * (0.82 + 0.18 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * jitter(ctx.rng, 0.14),
      size: ctx.size * 0.95,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** Falling leaves — slow embers that hang, flutter, and drift downward. */
export const fallingleaves: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.4 * ctx.rng.next()
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed + ctx.power * 0.04,
      life: ctx.life * 2.4 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.85,
      drag: ctx.drag * 1.6,
      color: pickColor(ctx),
      flags: FLUTTER,
    })
  }
}
