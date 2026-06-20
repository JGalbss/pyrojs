import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"

// Directional patterns — clustered or cone-shaped breaks.

const CROSS_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/** Stars that fly out in little "+" clusters — the crossette look. */
export const crossette: FireworkEffect = (emit, ctx) => {
  const clusters = Math.max(6, Math.round(ctx.count / CROSS_OFFSETS.length))
  for (let c = 0; c < clusters; c++) {
    const angle = (c / clusters) * TAU + (ctx.rng.next() - 0.5) * 0.2
    const speed = ctx.power * (0.85 + 0.25 * ctx.rng.next())
    const baseVx = Math.cos(angle) * speed
    const baseVy = Math.sin(angle) * speed
    const perp = speed * 0.16
    const color = pickColor(ctx)
    for (const [ox, oy] of CROSS_OFFSETS) {
      emit.emit({
        x: ctx.x,
        y: ctx.y,
        vx: baseVx + ox * perp,
        vy: baseVy + oy * perp,
        life: ctx.life * jitter(ctx.rng, 0.12),
        size: ctx.size * 0.9,
        drag: ctx.drag,
        color,
        flags: ParticleFlag.Glow,
      })
    }
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
