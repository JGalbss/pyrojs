import { ParticleFlag } from "../particles.js"
import { TAU } from "../math/scalar.js"
import { jitter, pickColor, type FireworkEffect } from "../emitter.js"
import type { Rgb } from "../color.js"

// Ground-device + novelty effects. Origin (ctx.x,ctx.y) is the device point on
// the ground. Canvas y grows downward, so straight up is -TAU/4 and gravity
// pulls +y.

const STRAIGHT_UP = -TAU / 4

const GOLD: Rgb = { r: 255, g: 196, b: 92 }
const SMOKE_GRAY: Rgb = { r: 150, g: 150, b: 160 }
const ASH: Rgb = { r: 120, g: 108, b: 96 }
const WHITE: Rgb = { r: 255, g: 252, b: 240 }

/** A narrow upward cone of sparks — a gerb/cone fountain. */
export const conefountain: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const angle = STRAIGHT_UP + (ctx.rng.next() - 0.5) * 0.4
    const speed = ctx.power * (0.7 + 0.6 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 1.2 * jitter(ctx.rng, 0.25),
      size: ctx.size * 0.85,
      drag: ctx.drag * 0.6,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** A wide instantaneous upward fan — a mine that shoots up and out. */
export const mine: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.2)
  for (let i = 0; i < count; i++) {
    const angle = STRAIGHT_UP + (ctx.rng.next() - 0.5) * 2.0
    const speed = ctx.power * (1.0 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow,
    })
  }
}

/** A flat spinning ground disc — tangential sparks hugging the ground. */
export const groundbloom: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const angle = ctx.rng.angle()
    const speed = ctx.power * (0.6 + 0.4 * ctx.rng.next())
    // Tangential to the spin, flattened so it stays near the ground.
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.2,
      life: ctx.life * jitter(ctx.rng, 0.2),
      size: ctx.size * 0.9,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** A stationary dense spray of tiny twinkling sparks in all directions. */
export const sparkler: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.5)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.35 * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.5 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.5,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
    })
  }
}

/** Rapid tiny bright pops — a string of firecrackers. */
export const firecracker: FireworkEffect = (emit, ctx) => {
  const count = Math.round(ctx.count * 1.8)
  for (let i = 0; i < count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.4 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.25 * jitter(ctx.rng, 0.4),
      size: ctx.size * 0.4,
      drag: ctx.drag,
      color: WHITE,
      flags: ParticleFlag.Glow | ParticleFlag.NoFade,
    })
  }
}

/** A few fast darting low streaks — chasers skimming the ground. */
export const chaser: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 10; i++) {
    const speed = ctx.power * (1.1 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: ctx.rng.sign() * speed,
      vy: (ctx.rng.next() - 0.5) * speed * 0.15,
      life: ctx.life * jitter(ctx.rng, 0.2),
      size: ctx.size * 0.8,
      drag: ctx.drag * 0.3,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** Erratic jumping sparks — a jumping jack scattering at random. */
export const jumpingjack: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const angle = ctx.rng.angle()
    const speed = ctx.power * (0.3 + 0.9 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 0.5 * jitter(ctx.rng, 0.4),
      size: ctx.size * 0.7,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Twinkle,
    })
  }
}

// Each roman-candle shot pops into a tiny outward burst.
const candleShot: FireworkEffect = (emit, ctx) => {
  const color = pickColor(ctx)
  for (let i = 0; i < 12; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.7 + 0.3 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * jitter(ctx.rng, 0.2),
      size: ctx.size,
      drag: ctx.drag,
      color,
      flags: ParticleFlag.Glow,
    })
  }
}

/** A sequence of single shots fired straight up with staggered fuses. */
export const romancandle: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 6; i++) {
    const angle = STRAIGHT_UP + (ctx.rng.next() - 0.5) * 0.15
    const speed = ctx.power * (0.9 + 0.2 * ctx.rng.next())
    emit.shell({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fuse: 0.12 + i * 0.16,
      effect: candleShot,
      colors: [pickColor(ctx)],
      count: 12,
      power: ctx.power * 0.3,
      size: ctx.size * 0.9,
      life: ctx.life * 0.6,
      drag: ctx.drag,
    })
  }
}

/** A wide downward curtain — a Niagara waterfall of gold. */
export const waterfall: FireworkEffect = (emit, ctx) => {
  const band = ctx.power * 0.6
  for (let i = 0; i < ctx.count; i++) {
    const horizontal = (ctx.rng.next() - 0.5) * 2 * band
    const fall = ctx.power * (0.3 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: horizontal,
      vy: fall,
      life: ctx.life * 1.8 * jitter(ctx.rng, 0.2),
      size: ctx.size * 0.85,
      drag: ctx.drag * 0.4,
      color: GOLD,
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}

/** Gray expanding puffs — flat, draggy, slow-fading smoke. */
export const smoke: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * 0.2 * (0.5 + 0.5 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 2.0 * jitter(ctx.rng, 0.2),
      size: ctx.size * 2.5,
      drag: ctx.drag * 2.5,
      color: SMOKE_GRAY,
      flags: ParticleFlag.None,
    })
  }
}

/** A slow low gray/ash trail — a smoke snake creeping along. */
export const snake: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const angle = STRAIGHT_UP + (ctx.rng.next() - 0.5) * 0.5
    const speed = ctx.power * 0.25 * (0.6 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 2.2 * jitter(ctx.rng, 0.2),
      size: ctx.size * 1.4,
      drag: ctx.drag * 1.5,
      color: ASH,
      flags: ParticleFlag.Streak,
    })
  }
}

/** A tiny single pop — a snapper's little crack of white sparks. */
export const snapper: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < 6; i++) {
    const dir = ctx.rng.inSphere(1)
    const speed = ctx.power * (0.5 + 0.4 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: dir.x * speed,
      vy: dir.y * speed,
      life: ctx.life * 0.4 * jitter(ctx.rng, 0.3),
      size: ctx.size * 0.6,
      drag: ctx.drag,
      color: WHITE,
      flags: ParticleFlag.Glow,
    })
  }
}

/** A cone of colorful confetti streamers — a party popper. */
export const partypopper: FireworkEffect = (emit, ctx) => {
  for (let i = 0; i < ctx.count; i++) {
    const angle = STRAIGHT_UP + (ctx.rng.next() - 0.5) * 0.7
    const speed = ctx.power * (0.6 + 0.6 * ctx.rng.next())
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: ctx.life * 0.8 * jitter(ctx.rng, 0.25),
      size: ctx.size,
      drag: ctx.drag,
      color: pickColor(ctx),
      flags: ParticleFlag.Streak,
    })
  }
}

/** A low forward horizontal spray — a ground "tank" firing to one side. */
export const tank: FireworkEffect = (emit, ctx) => {
  const facing = ctx.rng.sign()
  for (let i = 0; i < ctx.count; i++) {
    const speed = ctx.power * (0.6 + 0.6 * ctx.rng.next())
    const spread = (ctx.rng.next() - 0.5) * 0.5
    emit.emit({
      x: ctx.x,
      y: ctx.y,
      vx: facing * Math.cos(spread) * speed,
      vy: Math.sin(spread) * speed * 0.4,
      life: ctx.life * jitter(ctx.rng, 0.2),
      size: ctx.size * 0.85,
      drag: ctx.drag * 0.6,
      color: pickColor(ctx),
      flags: ParticleFlag.Glow | ParticleFlag.Streak,
    })
  }
}
