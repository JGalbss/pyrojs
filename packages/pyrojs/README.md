<div align="center">

# 🎆 pyrojs

### A fireworks engine for the web — like react-confetti, but fireworks.

Tiny, fast, framework-agnostic core · React bindings · an Effect-TS choreography DSL · 18 firework types.

<img src="https://raw.githubusercontent.com/JGalbss/fireworks/main/assets/hero.gif" alt="pyrojs fireworks" width="600" />

</div>

```bash
npm i pyrojs
```

```tsx
import { Fireworks } from "pyrojs/react"

export const App = () => <Fireworks intensity="energetic" />
```

One component, a full-screen show. Shells *rise*, arc, and *break* at apex into trailing stars that fall under gravity — a real firework, not confetti.

## Highlights

- **Fast** — Structure-of-Arrays typed-array particle engine, zero per-frame allocation.
- **Effect-TS to the core** — `Schema`-validated config, typed `Data.TaggedError` channels, a `Scope`-owned engine with forked fibers. The hot kernel runs in one `Effect.sync` per frame, so you get Effect everywhere *and* 60fps. Scores **100/100** on [agent-doctor](https://github.com/JGalbss/agent-doctor).
- **Three layers** — drop-in `<Fireworks/>` → imperative `createFireworks()` → declarative `pyrojs/show` DSL.
- **18 types** including shape bursts (hearts, stars). **Deterministic** with a `seed`.

## Quick examples

```ts
import { createFireworks, palettes } from "pyrojs"

const fw = createFireworks(canvas, { intensity: "energetic", colors: palettes.gold })
fw.launch({ type: "willow", x: 0.5, y: 0.3 })
fw.finale({ durationMs: 8000 })
```

```ts
import { timeline, at, salvo, fire, finale, peony, heart, willow, playShow } from "pyrojs/show"

const show = timeline(
  at("0s", salvo(3, peony())),
  at("1.5s", fire(heart({ colors: ["#ff2d6b"] }))),
  at("3s", salvo(5, willow())),
  at("5s", finale({ durationMs: 8000 })),
)

playShow(canvas, show)
```

## Entry points

| Import | Contents |
| --- | --- |
| `pyrojs` | engine, `createFireworks`, Effect-native `makeEngine`, config, palettes, presets |
| `pyrojs/react` | `<Fireworks/>`, `useFireworks` |
| `pyrojs/show` | choreography DSL (`timeline`, `salvo`, `finale`, spec builders…) |

`react` and `effect` are optional peer dependencies.

📖 **Full docs, the firework catalog, and a live playground:** https://github.com/JGalbss/fireworks

## License

MIT © JGalbss
