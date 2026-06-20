// Curated color palettes. Spread one into `colors` for an instant vibe:
//   createFireworks({ colors: palettes.gold })

export const palettes = {
  gold: ["#fff1b8", "#ffd700", "#ffae42", "#ff8c00"],
  silver: ["#ffffff", "#e6f0ff", "#c9d6e8", "#9fb3c8"],
  rainbow: ["#ff3b3b", "#ff9f1c", "#ffe14d", "#3bd16f", "#3b9dff", "#9b5de5"],
  sunset: ["#ff5e62", "#ff9966", "#ffd86f", "#fc9842"],
  ice: ["#caf0f8", "#90e0ef", "#48cae4", "#00b4d8"],
  ember: ["#ff2d00", "#ff6a00", "#ff9e00", "#ffd000"],
  neon: ["#39ff14", "#ff073a", "#00e5ff", "#ff00ff", "#faff00"],
  pastel: ["#ffd1dc", "#c1f0f6", "#d9c2f0", "#c8f7c5", "#fff5ba"],
  patriotic: ["#ff4d4d", "#ffffff", "#4d6fff"],
  emerald: ["#00ff87", "#60efff", "#aaffc3"],
  hot: ["#ff0040", "#ff8c00", "#ffd700"],
  aurora: ["#00ffa3", "#00d4ff", "#7a5cff", "#ff5ce1"],
} as const

export type PaletteName = keyof typeof palettes
