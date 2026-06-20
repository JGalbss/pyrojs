import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"

// Directional patterns — clustered or cone-shaped breaks.

const CROSS_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

// The secondary break each crossette spark pops into: a small 4-way cross.
const crossChild: FireworkEffect = (emit, ctx) => {
  const color = pickColor(ctx)
  for (const [ox, oy] of CROSS_OFFSETS) {
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: ox * ctx.power,
      vy: oy * ctx.power,
      life: ctx.life * jitter(ctx.rng, 0.15),
      size: ctx.size,
      drag: ctx.drag,
      color,
      flags: ParticleFlag.Glow,
    })
  }
}

/** Stars that fly out trailing, then split into little crosses mid-air. */
export const crossette: FireworkEffect = (emit, ctx) => {
  const sparks = Math.max(8, Math.round(ctx.count / 10))
  for (let i = 0; i < sparks; i++) {
    const angle = (i / sparks) * TAU + (ctx.rng.next() - 0.5) * 0.2
    const speed = ctx.power * (0.8 + 0.2 * ctx.rng.next())
    emit.shell({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fuse: ctx.rng.range(0.45, 0.7),
      effect: crossChild,
      colors: [pickColor(ctx)],
      count: 4,
      power: ctx.power * 0.28,
      size: ctx.size * 0.9,
      life: ctx.life * 0.55,
      drag: ctx.drag,
    })
  }
}

/** A tight upward cone of sparks — a ground gerb / fountain. */
export const fountain: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.2)
  for (let i = 0; i < count; i++) {
    // -TAU/4 points straight up (canvas y grows downward).
    const angle = -TAU / 4 + (ctx.rng.next() - 0.5) * 0.6
    const speed = ctx.power * (0.7 + 0.6 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 1.3 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.85,
      drag: ctx.drag * 0.6,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}
