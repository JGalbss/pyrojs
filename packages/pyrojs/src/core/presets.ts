import { palettes } from "../engine/palettes.js"
import type { FireworksConfigInput } from "./config.js"

// Ready-made show configurations. `satisfies` keeps them type-checked against the
// config schema input without widening the literal types.
export const presets = {
  /** Rapid-fire, everything-at-once grand finale. */
  finale: {
    intensity: "insane",
    launchInterval: [120, 320],
    trail: 0.86,
    types: ["peony", "chrysanthemum", "willow", "brocade", "crossette", "palm"],
  },
  /** Champagne golds and silvers for a midnight countdown. */
  newYear: {
    intensity: "energetic",
    colors: [...palettes.gold, ...palettes.silver],
    types: ["brocade", "willow", "chrysanthemum", "ring"],
  },
  /** Slow, sparse, and calm — ambient background fireworks. */
  subtle: {
    intensity: "calm",
    launchInterval: [1600, 2800],
    trail: 0.9,
    types: ["peony", "willow", "glitter"],
  },
  /** Playful, colorful, with hearts and stars. */
  birthday: {
    colors: palettes.rainbow,
    types: ["peony", "heart", "star", "ring", "crossette"],
  },
  /** Warm embers, crackles, and fountains. */
  diwali: {
    intensity: "energetic",
    colors: palettes.ember,
    types: ["chrysanthemum", "brocade", "fountain", "strobe"],
  },
} satisfies Record<string, FireworksConfigInput>

export type PresetName = keyof typeof presets
