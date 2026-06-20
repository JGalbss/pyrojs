import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"
import { peony } from "./spherical.js"

// Deeper, multi-component and motion-driven breaks — the showpieces.

/** A flower: a colored outer sphere wrapped around a contrasting twinkling core. */
export const pistil: FireworkEffect = (emit, ctx) => {
  const outer = ctx.colors[ctx.colors.length - 1]
  const inner = ctx.colors[0]
  const half = Math.max(8, Math.round(ctx.count * 0.6))
  for (let i = 0; i < half; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.8 + 0.2 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * jitter(ctx.rng, 0.15),
      size: ctx.size,
      drag: ctx.drag,
      color: outer,
      flags: ParticleFlag.Glow,
    })
  }
  for (let i = 0; i < half; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.42 * (0.8 + 0.2 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.9 * jitter(ctx.rng, 0.15),
      size: ctx.size * 0.9,
      drag: ctx.drag * 1.2,
      color: inner,
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
    })
  }
}

/** Erratic, flickering sparks that scatter and buzz. */
export const bees: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.1)
  for (let i = 0; i < count; i++) {
    const angle = ctx.rng.angle()
    const speed = ctx.power * (0.3 + 0.7 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 0.7 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.7,
      drag: ctx.drag * 0.5 + 0.3,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
    })
  }
}

/** A pinwheel: spiral arms of streaking stars. */
export const spinner: FireworkEffect = (emit, ctx) => {
  const arms = 5
  const perArm = Math.max(6, Math.round(ctx.count / arms))
  for (let arm = 0; arm < arms; arm++) {
    const base = (arm / arms) * TAU
    const color = pickColor(ctx)
    for (let i = 0; i < perArm; i++) {
      const t = i / perArm
      const angle = base + t * 1.4
      const speed = ctx.power * (0.3 + 0.7 * t)
      emit.emit({
        x: ctx.x,
        y: ctx.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: ctx.life * jitter(ctx.rng, 0.12),
        size: ctx.size * 0.9,
        drag: ctx.drag * 0.6,
        color,
        flags: ParticleFlag.Glow | ParticleFlag.Streak,
      })
    }
  }
}

/** Fast, twinkling streaks that dart outward like swimming fish. */
export const fish: FireworkEffect = (emit, ctx) => {
  const count = Math.max(12, Math.round(ctx.count * 0.5))
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (1.2 + 0.6 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.8 * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag * 0.2,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak | ParticleFlag.Twinkle,
    })
  }
}

/** An upward fan of long rising tails that arc over. */
export const tail: FireworkEffect = (emit, ctx) => {
  const count = Math.max(8, Math.round(ctx.count * 0.32))
  for (let i = 0; i < count; i++) {
    const angle = -TAU / 4 + (ctx.rng.next() - 0.5) * 0.8
    const speed = ctx.power * (0.9 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 1.6 * jitter(ctx.rng, 0.15),
      size: ctx.size * 1.2,
      drag: ctx.drag * 0.3,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** A necklace of big, slow, evenly spaced glowing pearls. */
export const pearls: FireworkEffect = (emit, ctx) => {
  const count = Math.max(10, Math.round(ctx.count * 0.18))
  const color = pickColor(ctx)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * TAU
    const speed = ctx.power * 0.7
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 1.4 * jitter(ctx.rng, 0.08),
      size: ctx.size * 2.2,
      drag: ctx.drag * 1.6,
      color,
      flags: ParticleFlag.Glow,
    })
  }
}

/** A dense golden willow that hangs and droops for a long time. */
export const kamuro: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.5)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.5 * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed - ctx.power * 0.05,
      life: ctx.life * 3 * jitter(ctx.rng, 0.18),
      size: ctx.size * 0.95,
      drag: ctx.drag * 0.25,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** Dense, hard crackling sparks that flicker until they wink out. */
export const flitter: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.6)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.4 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.7 * jitter(ctx.rng, 0.25),
      size: ctx.size * 0.6,
      drag: ctx.drag * 1.4,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle | ParticleFlag.NoFade,
    })
  }
}

/** A shell that breaks into several sub-shells, each a colored peony. */
export const multibreak: FireworkEffect = (emit, ctx) => {
  const breaks = ctx.rng.int(3, 5)
  for (let i = 0; i < breaks; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.5 + 0.3 * ctx.rng.next())
    emit.shell({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      fuse: ctx.rng.range(0.3, 0.6),
      effect: peony,
      colors: [ctx.rng.pick(ctx.colors)],
      count: Math.round(ctx.count * 0.4),
      power: ctx.power * 0.6,
      size: ctx.size,
      life: ctx.life * 0.8,
      drag: ctx.drag,
    })
  }
}
