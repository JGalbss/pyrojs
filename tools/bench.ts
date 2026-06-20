import { performance } from "node:perf_hooks"
import { Particles, ParticleFlag } from "../packages/pyrojs/src/engine/particles.js"
import { defaultForces, stepParticles } from "../packages/pyrojs/src/engine/kernel.js"
import { createRandom } from "../packages/pyrojs/src/engine/math/rng.js"

// Measures the physics kernel (stepParticles) throughput at steady state.
// This is the CPU-bound hot path; in the browser, drawing is GPU-accelerated on
// top of this. Numbers feed the README performance table.

const rng = createRandom(20260619)

const benchKernel = (count: number): { count: number; msPerFrame: number } => {
  const particles = new Particles(count, count)
  for (let i = 0; i < count; i++) {
    particles.spawn({
      x: 0,
      y: 0,
      vx: rng.range(-160, 160),
      vy: rng.range(-160, 160),
      life: 10_000,
      size: 2,
      drag: 0.5,
      r: 255,
      g: 200,
      b: 120,
      flags: ParticleFlag.Glow,
      seed: rng.next(),
    })
  }
  for (let i = 0; i < 60; i++) stepParticles(particles, 0.016, defaultForces, rng)
  const frames = 400
  const start = performance.now()
  for (let i = 0; i < frames; i++) stepParticles(particles, 0.016, defaultForces, rng)
  const elapsed = performance.now() - start
  return { count: particles.count, msPerFrame: elapsed / frames }
}

const counts = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000]

// eslint-disable-next-line no-console
console.log("particles |  ms/frame |  headroom @60fps target (16.7ms budget)")
// eslint-disable-next-line no-console
console.log("----------|-----------|-----------------------------------------")
for (const count of counts) {
  const { msPerFrame } = benchKernel(count)
  const budgetPct = Math.round((msPerFrame / 16.7) * 100)
  // eslint-disable-next-line no-console
  console.log(
    `${String(count).padStart(9)} | ${msPerFrame.toFixed(3).padStart(8)}ms | ${String(budgetPct).padStart(3)}% of a 60fps frame budget`,
  )
}
