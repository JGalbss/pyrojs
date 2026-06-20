# pyrojs — design notes

Why the library is shaped the way it is. (Generated alongside the implementation;
kept in the repo as the rationale of record.)

## Goals

1. **react-confetti easy** — one component, a full-page overlay show, zero config.
2. **Actually fireworks** — shells rise, arc, and break at apex into trailing stars
   that fall under gravity, with secondary behaviors (twinkle, streaks, shapes).
3. **Build-your-own-show** — a composable, declarative choreography API.
4. **Fast** — thousands of particles at 60fps, no GC churn.
5. **Effect-TS as the backbone**, not bolted on.
6. **Reusable & publishable** — one npm package, typed, ESM+CJS, tree-shakeable.

## The central tension: "Effect everywhere" vs. 60fps

A per-particle `Effect.gen`/`yield*` in a loop that runs ~10⁴ times per frame at
60Hz would be catastrophic — Effect has per-operation overhead by design. So the
resolution is a **clean altitude split**:

- **Effect owns the program.** Configuration is validated with `Schema`; failures
  are `Data.TaggedError` channels; the engine lifecycle (canvas acquisition, DOM
  observers, the render loop, the autopilot) is an Effect program where resources
  are `Scope`d and the loops are `forkScoped` fibers, with all state in `Ref`s.
  The show DSL compiles to `Schedule`-driven, structured-concurrent Effects.
- **The kernel stays plain.** Particle storage, integration, and canvas drawing
  are allocation-conscious imperative TypeScript. Each frame, the Effect loop
  hosts the *entire* kernel in **one** `Effect.sync`. Effect is everywhere it adds
  value (types, errors, resources, scheduling) and absent from the one place it
  would cost frames.

This is idiomatic Effect — you host a CPU kernel in `Effect.sync`; you don't lift
a numeric loop into `Effect.gen`. The Effect code scores **100/100** on
[agent-doctor](https://github.com/JGalbss/agent-doctor), the project's own Effect
linter, run on every change.

## Effect v3, not v4

`effect@latest` is **3.21** at build time; v4 is `beta`. A published library pins
a *peer* dependency, so shipping against a pre-release would force churn on every
consumer. We target stable v3 and revisit when v4 ships.

## Layers

```
pyrojs            engine + createFireworks() facade + Effect-native makeEngine()
pyrojs/react      <Fireworks/> overlay + useFireworks() hook
pyrojs/show       choreography DSL (timeline/salvo/finale, Schedule-driven)
```

Each layer is independently usable and built on the one below. `react` and
`effect` are optional peer dependencies; subpath exports keep what you don't
import out of your bundle.

## Performance design

- **Structure-of-Arrays** particle store: one typed array per attribute
  (`Float32Array` for position/velocity/life/size, `Uint8ClampedArray` for color).
  A particle is just an index — no per-particle objects, cache-friendly iteration.
- **Swap-remove**: dead particles are removed by moving the last live particle
  into the freed slot, keeping `[0, count)` densely packed with no holes and no
  free-list.
- **Growth, not churn**: the store grows geometrically up to `maxParticles`, then
  gracefully drops new spawns rather than allocating unbounded.
- **Rendering**: cached radial-gradient **glow sprites** drawn with `drawImage`
  (GPU-friendly, far cheaper than per-particle `shadowBlur`); additive blending
  via `globalCompositeOperation = "lighter"`; motion **trails** via fading the
  previous frame (`destination-out` so it works on a transparent overlay).
- **Loop**: a single RAF-driven fiber with a clamped delta (so a backgrounded tab
  doesn't produce a huge catch-up step), paused entirely when the tab is hidden.
- Measured kernel throughput: **50,000 particles step in ~0.8ms** — see `pnpm bench`.

## Firework taxonomy

Effects are pure functions `(emitter, burstContext) => void` that lay down a break
by emitting stars; they never touch the particle store directly. The catalog spans
spherical (peony, chrysanthemum, dahlia, ring, strobe, brocade, glitter, salute,
burst), trailing (willow, palm, horsetail, comet, spider), directional (crossette,
fountain), and point-sampled shapes (heart, star). A rising **shell** carries a
resolved burst up on tuned kinematics (decoupled from the gentle particle gravity
so rises stay snappy) and detonates at apex.

## Boundary validation

Everything user-supplied flows through `Schema` exactly once (`decodeFireworksConfig`,
`decodeLaunchSpec`) and emerges fully defaulted, so the rest of the code never
re-checks input. Colors are validated by a `Schema.filter` backed by the parser.
`intensity` is a named enum mapped through a lookup table of scale factors — no
branching.

## Determinism

The engine uses a seeded PRNG (mulberry32). Given a `seed`, a show is byte-for-byte
reproducible — which is what makes the headless GIF/bench tooling and the unit
tests stable.

## Tooling

- **tsup** → ESM + CJS + `.d.ts`, `react`/`effect` external.
- **vitest** → pure-logic + a headless simulation smoke test (mock canvas).
- **agent-doctor** → Effect-idiom gate (100/100).
- **@napi-rs/canvas + gifenc** → render the README GIFs headlessly from the real
  engine (`tools/gen-gifs.ts`), so the docs can never drift from the code.
