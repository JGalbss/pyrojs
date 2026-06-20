import type { FireworkType } from "../../core/config.js"
import type { FireworkEffect } from "../emitter.js"
import {
  brocade,
  burst,
  dahlia,
  glitter,
  peony,
  chrysanthemum,
  ring,
  salute,
  strobe,
} from "./spherical.js"
import { comet, horsetail, palm, spider, willow } from "./trailing.js"
import { crossette, fountain } from "./directional.js"
import { heart, star } from "./shapes.js"
import {
  bees,
  fish,
  flitter,
  kamuro,
  multibreak,
  pearls,
  pistil,
  spinner,
  tail,
} from "./advanced.js"

// The single source of truth mapping a firework type name to its break pattern.
// A total Record means adding a name to `FIREWORK_TYPES` forces an entry here.
export const effectRegistry: Record<FireworkType, FireworkEffect> = {
  peony,
  chrysanthemum,
  willow,
  palm,
  ring,
  crossette,
  strobe,
  brocade,
  comet,
  spider,
  dahlia,
  horsetail,
  salute,
  fountain,
  heart,
  star,
  burst,
  glitter,
  pistil,
  bees,
  spinner,
  fish,
  tail,
  pearls,
  kamuro,
  flitter,
  multibreak,
}

export const getEffect = (type: FireworkType): FireworkEffect => effectRegistry[type]
