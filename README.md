<div align="center">

# 🎆 pyrojs

### A fireworks engine for the web — like react-confetti, but fireworks.

Tiny, fast, framework-agnostic core · React bindings · an Effect-TS choreography DSL · 18 firework types · build your own show.

<img src="assets/hero.gif" alt="pyrojs fireworks show" width="600" />

</div>

---

```bash
npm i pyrojs
```

```tsx
import { Fireworks } from "pyrojs/react"

export const App = () => <Fireworks intensity="energetic" />
```

That's the whole thing. One component, a full-screen show. Read on for the parts you can tweak — and the parts you can compose.

---

## Why pyrojs

- **Genuinely a firework, not confetti.** Shells *rise* from the ground, arc, and *break* at apex into stars that fall under gravity with trails. Not just particles appearing in place.
- **Fast.** A Structure-of-Arrays particle engine on typed arrays with swap-remove and object pooling — thousands of particles at 60fps with zero per-frame allocation.
- **Effect-TS to the core.** Config is validated with `Schema`, failures are typed `Data.TaggedError` channels, and the engine lifecycle (canvas, RAF loop, autopilot) is a `Scope`-owned program with forked fibers. The hot numeric kernel runs inside a single `Effect.sync` per frame — Effect everywhere it adds value, never in the inner loop where it would cost you frames.
- **Three layers, one engine.** Drop-in component → imperative handle → declarative show DSL. Use as much as you need.
- **18 firework types** out of the box, plus shape bursts (hearts, stars).
- **Deterministic.** Pass a `seed` and the show is byte-for-byte reproducible (great for tests and recordings).
- **Tree-shakeable, typed, ESM + CJS.** `react` and `effect` are optional peers.

> The Effect code scores **100/100** on [agent-doctor](https://github.com/JGalbss/agent-doctor). 🩺

## The firework catalog

<table>
  <tr>
    <td align="center"><img src="assets/type-peony.gif" width="200"/><br/><b>peony</b></td>
    <td align="center"><img src="assets/type-chrysanthemum.gif" width="200"/><br/><b>chrysanthemum</b></td>
    <td align="center"><img src="assets/type-willow.gif" width="200"/><br/><b>willow</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/type-crossette.gif" width="200"/><br/><b>crossette</b></td>
    <td align="center"><img src="assets/type-ring.gif" width="200"/><br/><b>ring</b></td>
    <td align="center"><img src="assets/type-palm.gif" width="200"/><br/><b>palm</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/type-heart.gif" width="200"/><br/><b>heart</b></td>
    <td align="center"><img src="assets/type-strobe.gif" width="200"/><br/><b>strobe</b></td>
    <td align="center"><sub>…and dahlia, brocade, comet, spider,<br/>horsetail, salute, fountain, star, glitter, burst</sub></td>
  </tr>
</table>

Full list: `peony`, `chrysanthemum`, `willow`, `palm`, `ring`, `crossette`, `strobe`, `brocade`, `comet`, `spider`, `dahlia`, `horsetail`, `salute`, `fountain`, `heart`, `star`, `burst`, `glitter`.

## Three ways to use it

### 1. React — drop-in overlay

```tsx
import { Fireworks } from "pyrojs/react"

// Autopilot full-screen show
<Fireworks intensity="insane" colors={["#ffd700", "#ff4d4d", "#4dd2ff"]} />

// Pause/resume with `run`, and grab a handle to fire your own
import { useRef } from "react"
import type { FireworksHandle } from "pyrojs"

const handle = useRef<FireworksHandle>(null)
<button onClick={() => handle.current?.launch({ type: "heart" })}>❤️</button>
<Fireworks run handleRef={handle} autoplay={false} />
```

Or bind your own canvas with the hook:

```tsx
import { useRef } from "react"
import { useFireworks } from "pyrojs/react"

const canvasRef = useRef<HTMLCanvasElement>(null)
const fw = useFireworks(canvasRef, { colors: ["#fff"] })
// fw.current?.finale()
return <canvas ref={canvasRef} style={{ width: "100%", height: 400 }} />
```

### 2. Vanilla — imperative handle

```ts
import { createFireworks, palettes } from "pyrojs"

const fw = createFireworks(canvas, { intensity: "energetic", colors: palettes.gold })

fw.launch({ type: "willow", x: 0.5, y: 0.3 })   // x/y are normalized 0..1
fw.finale({ durationMs: 8000, shellsPerSecond: 10 })
fw.stop()
fw.start()
fw.destroy()                                     // releases canvas, fibers, observers
```

### 3. Effect — compose a choreographed show

`pyrojs/show` is a small declarative DSL that compiles to scheduled launches using Effect's `Schedule` and structured concurrency.

```ts
import { timeline, at, salvo, fire, finale, peony, willow, heart, ring } from "pyrojs/show"
import { playShow } from "pyrojs/show"
import { palettes } from "pyrojs"

const grandFinale = timeline(
  at("0s", salvo(3, peony({ colors: palettes.gold }))),
  at("1.5s", fire(heart({ colors: ["#ff2d6b"] }))),
  at("3s", salvo(5, willow())),
  at("4.5s", salvo(8, ring({ colors: palettes.ice }))),
  at("6s", finale({ durationMs: 8000 })),
)

const handle = playShow(canvas, grandFinale)   // returns a FireworksHandle
```

Prefer the Effect-native engine? `makeEngine` returns an `Effect` requiring a `Scope`:

```ts
import { Effect } from "effect"
import { makeEngine } from "pyrojs"
import { runShow, timeline, at, peony } from "pyrojs/show"

const program = Effect.gen(function* () {
  const engine = yield* makeEngine(canvas, { autoplay: false })
  yield* runShow(engine, timeline(at("0s", peony())))
})

Effect.runFork(Effect.scoped(program))
```

## Show DSL reference

| Combinator | What it does |
| --- | --- |
| `fire(spec)` | Fire one shell |
| `salvo(n, spec)` | Fire `n` copies at once (a volley) |
| `burst(specs[])` | Fire several different shells at once |
| `wait("2s")` | Pause |
| `sequence(...shows)` | Run shows one after another |
| `all(...shows)` | Run shows concurrently |
| `repeat({ times, every }, show)` | Repeat a show on a schedule |
| `timeline(at(t, show), ...)` | Choreograph by absolute offset |
| `finale(opts)` | A timed grand-finale barrage |

Spec builders (`peony`, `willow`, `heart`, … one per type) take `{ x, y, colors, count, power, size, life, rise }`.

## Configuration

Everything below is optional with sensible defaults; all of it is validated by `Schema`.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `intensity` | `"calm" \| "normal" \| "energetic" \| "insane"` | `"normal"` | Scales counts, cadence, power |
| `autoplay` | `boolean` | `true` | Run an autopilot show |
| `launchInterval` | `number \| [min, max]` ms | `[600, 1400]` | Time between auto launches |
| `types` | `FireworkType[]` | 6 favorites | Autopilot pool |
| `colors` | `string[]` | curated set | Hex / `rgb()` / `hsl()` |
| `launchArea` | `{ x: [n,n]; y: [n,n] }` | `{x:[.1,.9], y:[.15,.5]}` | Where shells break (normalized) |
| `gravity` | `number` px/s² | `60` | |
| `wind` | `number` px/s² | `0` | |
| `turbulence` | `number` | `0` | Flicker/flutter |
| `trail` | `0..1` | `0.82` | Motion-trail persistence |
| `brightness` | `number` | `1` | |
| `additive` | `boolean` | `true` | Glow on overlap |
| `background` | `string` | `"transparent"` | Overlay, or set a night sky |
| `particleScale` | `number` | `1` | |
| `speed` | `number` | `1` | Time scale (slow-mo / fast) |
| `maxParticles` | `number` | `30000` | Memory ceiling (graceful drop) |
| `seed` | `number` | — | Deterministic, reproducible show |
| `pauseWhenHidden` | `boolean` | `true` | Page Visibility API |
| `respectReducedMotion` | `boolean` | `true` | |

Palettes (`import { palettes } from "pyrojs"`): `gold`, `silver`, `rainbow`, `sunset`, `ice`, `ember`, `neon`, `pastel`, `patriotic`, `emerald`, `hot`, `aurora`.

Presets (`import { presets } from "pyrojs"`): `finale`, `newYear`, `subtle`, `birthday`, `diwali`.

## Performance

The particle kernel is Structure-of-Arrays over typed arrays with swap-remove and
no per-frame allocation. Measured throughput of the physics step (`pnpm bench`,
Node 24, M-series; browser drawing is GPU-accelerated on top of this):

| live particles | kernel step / frame | share of a 60fps (16.7ms) budget |
| ---: | ---: | ---: |
| 1,000 | 0.007 ms | ~0% |
| 10,000 | 0.08 ms | ~0.5% |
| 25,000 | 0.19 ms | ~1% |
| 50,000 | 0.8 ms | ~5% |
| 100,000 | 0.8 ms | ~5% |

In other words, the simulation leaves essentially the entire frame budget free —
rendering is the practical ceiling, and the engine pauses entirely when the tab
is hidden. The docs demos show a **live FPS + particle counter** so you can see it
on your own hardware.

## Architecture

```
pyrojs            core engine + imperative facade + Effect-native makeEngine
pyrojs/react      <Fireworks/> + useFireworks
pyrojs/show       Effect choreography DSL (Schedule/timeline)
```

- **Effect is the backbone.** `Schema` validates every boundary; errors are tagged channels; `makeEngine` is an Effect program that acquires the canvas + DOM observers as scoped resources and forks the render loop and autopilot as `Scope`d fibers, with all state in `Ref`s.
- **The kernel stays plain.** Particle storage (SoA typed arrays), integration, and canvas drawing are allocation-conscious imperative TS. Each frame, the Effect loop hosts the whole kernel in **one** `Effect.sync` — never `yield*` per particle. That's how you get "Effect everywhere" *and* 60fps.
- The GIFs in this README were rendered by the real engine, headlessly, via `@napi-rs/canvas` — see [`tools/gen-gifs.ts`](tools/gen-gifs.ts).

## Development

```bash
pnpm install
pnpm build           # tsup → ESM + CJS + d.ts
pnpm test            # vitest
pnpm doctor          # agent-doctor over the Effect code
pnpm gifs            # regenerate the README GIFs
pnpm docs:dev        # the docs & playground site
```

## License

MIT © JGalbss
