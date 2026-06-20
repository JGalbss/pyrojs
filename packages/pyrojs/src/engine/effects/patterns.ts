import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type BurstContext, type Emitter, type FireworkEffect } from "../emitter.js"

// Figure bursts — stars whose launch velocities trace a 2D curve so the break
// momentarily paints the figure before gravity reclaims it. High drag bleeds off
// speed quickly, letting each star settle into its place on the shape so the
// silhouette reads cleanly. Offsets are normalized to roughly [-1, 1]; since the
// canvas y axis grows downward, the mathematical y is negated to keep figures
// upright.

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

// A handful of fixed face features overlaid on the rim of the smiley. Eyes sit
// above center; the smile is a downward arc whose y is negated for the canvas.
const smileyFeature = (i: number): readonly [number, number] => {
  if (i === 0) return [-0.35, 0.35]
  if (i === 1) return [0.35, 0.35]
  const a = Math.PI * (0.15 + 0.7 * ((i - 2) / 6))
  return [Math.cos(a) * 0.55, -(Math.sin(a) * 0.55 - 0.15)]
}

/** A smiling face — a big rim with two eyes and a grinning arc. */
export const smiley: FireworkEffect = (emit, ctx) => {
  emitShape(emit, ctx, (t) => {
    const idx = Math.round((t / TAU) * ctx.count)
    if (idx < 8) return smileyFeature(idx)
    return [Math.cos(t), Math.sin(t)]
  })
}

/** The classic butterfly curve — wings spread, painted in fire. */
export const butterfly: FireworkEffect = (emit, ctx) => {
  emitShape(emit, ctx, (t) => {
    const r =
      Math.exp(Math.sin(t)) -
      2 * Math.cos(4 * t) +
      Math.pow(Math.sin((2 * t - Math.PI) / 24), 5)
    return [(Math.sin(t) * r) / 3.5, -((Math.cos(t) * r) / 3.5)]
  })
}

/** A maple leaf — a wavy radial silhouette with lobed edges. */
export const maple: FireworkEffect = (emit, ctx) => {
  emitShape(emit, ctx, (t) => {
    const r = 0.6 + 0.4 * Math.cos(5 * t) + 0.1 * Math.cos(10 * t)
    return [Math.cos(t) * r, -(Math.sin(t) * r)]
  })
}

/** A bowtie — two triangles kissing at the origin. */
export const bowtie: FireworkEffect = (emit, ctx) => {
  emitShape(emit, ctx, (t) => {
    const r = Math.abs(Math.cos(t))
    return [Math.cos(t) * r, -(Math.sin(t) * r * 0.5)]
  })
}

/** A snail shell — an Archimedean spiral winding outward. */
export const snail: FireworkEffect = (emit, ctx) => {
  emitShape(emit, ctx, (t) => {
    const rr = t / TAU
    return [Math.cos(t * 3) * rr, -(Math.sin(t * 3) * rr)]
  })
}
