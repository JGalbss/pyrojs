import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"
import type { Rgb } from "../color.js"

// Crackle / glitter / rain breaks — the chemistry-driven textures: hard-strobing
// titanium crackle, gold-to-white dragon eggs, and the long slow drift of rain.

/** Warm white the gold cores burn toward as they cool. */
const EMBER_WHITE: Rgb = { r: 255, g: 255, b: 235 }

/** Bias a downward drift while keeping a little lateral spread (canvas Y is down). */
const rainDir = (rng: { next: () => number; range: (a: number, b: number) => number }): { x: number; y: number } => ({
  x: Math.cos(rng.range(0, TAU)) * 0.35,
  y: 0.55 + 0.45 * rng.next(),
})

/** Dense titanium crackle: tiny stars that strobe hard then snap out. */
export const crackle: FireworkEffect = (emit, ctx) => {
  const total = Math.round(ctx.count * 1.6)
  for (let i = 0; i < total; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.6 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.6,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle | ParticleFlag.NoFade,
    })
  }
}

/** Popping clusters whose gold cores shift to white as they cool and crackle. */
export const dragoneggs: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.5 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.8 * jitter(ctx.rng, 0.25),
      size: ctx.size * 0.85,
      drag: ctx.drag,
      color: pickColor(ctx),
      color2: EMBER_WHITE,
      flags: ParticleFlag.Glow | ParticleFlag.ColorShift | ParticleFlag.Twinkle,
    })
  }
}

/** A long-hanging curtain of glowing drops that drift slowly downward. */
export const timerain: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = rainDir(ctx.rng)
    const speed = ctx.power * (0.18 + 0.12 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 2.5 * jitter(ctx.rng, 0.2),
      size: ctx.size * 1.25,
      drag: ctx.drag * 0.4,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** Time-rain that crackles: the slow falling drops strobe as they sink. */
export const cracklingrain: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = rainDir(ctx.rng)
    const speed = ctx.power * (0.18 + 0.12 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 2.5 * jitter(ctx.rng, 0.2),
      size: ctx.size * 1.25,
      drag: ctx.drag * 0.4,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
    })
  }
}
