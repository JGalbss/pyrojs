import type { FireworkType } from "./config.js"

// Groups every firework type into a browseable category. Used by the showcase
// site's grid; also handy for building type pickers. Every FIREWORK_TYPES entry
// appears in exactly one category.

export interface FireworkCategory {
  readonly name: string
  readonly blurb: string
  readonly types: ReadonlyArray<FireworkType>
}

export const FIREWORK_CATEGORIES: ReadonlyArray<FireworkCategory> = [
  {
    name: "Aerial breaks",
    blurb: "Spherical and trailing shells — the bread and butter of the night sky.",
    types: [
      "peony",
      "chrysanthemum",
      "dahlia",
      "willow",
      "kamuro",
      "nishiki",
      "brocade",
      "palm",
      "coconut",
      "horsetail",
      "spider",
      "comet",
      "tail",
      "pearls",
    ],
  },
  {
    name: "Rings & patterns",
    blurb: "Flat rings and point-sampled shapes that paint a figure in the air.",
    types: ["ring", "saturn", "heart", "star", "smiley", "butterfly", "maple", "bowtie", "snail"],
  },
  {
    name: "Multi-stage",
    blurb: "Shells that split mid-air into secondary breaks via fused spark-shells.",
    types: ["crossette", "pistil", "diadem", "multibreak", "bouquet"],
  },
  {
    name: "Glitter & crackle",
    blurb: "Twinkling, flickering, and slowly-falling sparks.",
    types: [
      "glitter",
      "strobe",
      "flitter",
      "crackle",
      "dragoneggs",
      "timerain",
      "cracklingrain",
      "fallingleaves",
    ],
  },
  {
    name: "Spinners & motion",
    blurb: "Pinwheels, tourbillions, and erratic darting movers.",
    types: [
      "spinner",
      "tourbillion",
      "girandola",
      "wheel",
      "pinwheel",
      "helicopter",
      "hummer",
      "serpent",
      "fish",
      "bees",
      "parachute",
    ],
  },
  {
    name: "Ground & novelty",
    blurb: "Fountains, gerbs, ground spinners, and the funny little ones.",
    types: [
      "fountain",
      "conefountain",
      "mine",
      "groundbloom",
      "waterfall",
      "sparkler",
      "firecracker",
      "chaser",
      "jumpingjack",
      "romancandle",
      "snake",
      "snapper",
      "partypopper",
      "tank",
      "smoke",
    ],
  },
  {
    name: "Sound & special",
    blurb: "Salutes, reports, color-changers, and ghostly fades.",
    types: ["salute", "report", "flash", "burst", "colorchange", "ghost"],
  },
]
