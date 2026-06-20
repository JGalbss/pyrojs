import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type BurstContext, type Emitter, type FireworkEffect } from "../emitter.js"

// Pattern bursts — stars whose launch velocities trace a 2D shape, so the break
// momentarily spells out the figure before gravity reclaims it. High drag lets
// the stars decelerate into position so the shape reads clearly.

const emitShape = (
  emit: Emitter,
  ctx: BurstContext,
  offsetAt: (t: number) => readonly [number, number],
): void => {
  for (let i = 0; i < ctx.count; i++) {
    const t = (i / ctx.count) * TAU
    const [ox, oy] = offsetAt(t)
    const speed = ctx.power * 1.1
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: ox * speed * jitter(ctx.rng, 0.04),
      vy: oy * speed * jitter(ctx.rng, 0.04),
      life: ctx.life * 1.2 * jitter(ctx.rng, 0.1),
      size: ctx.size,
      drag: ctx.drag * 2.4,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** A heart — perfect for the romantics. */
export const heart: FireworkEffect = (emit, ctx) => {
  emitShape(emit, ctx, (t) => {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y =
      13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    // Canvas y grows downward, so negate to keep the heart upright.
    return [x / 17, -y / 17]
  })
}

/** A five-pointed star. */
export const star: FireworkEffect = (emit, ctx) => {
  const spikes = 5
  emitShape(emit, ctx, (t) => {
    const radius = 0.55 + 0.45 * Math.cos(spikes * t)
    return [Math.cos(t) * radius, Math.sin(t) * radius]
  })
}
