import { ParticleFlag } from "../particles.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"
import type { Rgb } from "../color.js"

// Special / utility breaks: the punctuation of a show. Reports and flashes are
// the percussive hits (a hard crack of light, gone almost instantly); colorchange
// and ghost are slow, atmospheric breaks that play with how a star fades.

/** Bright slightly-warm white used by reports and flashes. */
const FLASH_WHITE: Rgb = { r: 255, g: 255, b: 245 }

/**
 * Report — a single hard crack of light. A tight, very fast cluster of large
 * white stars that snaps outward and is gone in a quarter of the normal life.
 */
export const report: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 30; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.85 + 0.3 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.25 * jitter(ctx.rng, 0.15),
      size: ctx.size * 1.6,
      drag: ctx.drag,
      color: FLASH_WHITE,
      flags: ParticleFlag.Glow,
    })
  }
}

/**
 * Flash — a brilliant full-field bloom of light. Many very-fast, very-short-life
 * white stars that hold full brightness (NoFade) so the whole break reads as one
 * blinding sheet before it cuts out.
 */
export const flash: FireworkEffect = (emit, ctx) => {
  const total = Math.round(ctx.count * 1.4)
  for (let i = 0; i < total; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (1.1 + 0.35 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.18 * jitter(ctx.rng, 0.12),
      size: ctx.size,
      drag: ctx.drag,
      color: FLASH_WHITE,
      flags: ParticleFlag.Glow | ParticleFlag.NoFade,
    })
  }
}

/**
 * Colorchange — a peony whose every star transitions from the palette's first
 * color to its last over its lifetime, so the whole break visibly shifts hue as
 * it burns.
 */
export const colorchange: FireworkEffect = (emit, ctx) => {
  const from = ctx.colors[0]
  const to = ctx.colors[ctx.colors.length - 1]
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
      color: from,
      color2: to,
      flags: ParticleFlag.Glow | ParticleFlag.ColorShift,
    })
  }
}

/**
 * Ghost — eerie stars that fade in, glow at mid-life, then fade out (Ghost flag).
 * A soft, slow round break that seems to materialize out of the dark and dissolve
 * back into it.
 */
export const ghost: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.6 + 0.3 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 1.3 * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Ghost,
    })
  }
}
