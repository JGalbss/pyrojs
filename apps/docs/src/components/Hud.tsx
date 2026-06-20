import { useEffect, useState } from "react"
import type { RefObject } from "react"
import type { EngineStats, FireworksHandle } from "@jgalbsss/pyrojs"

/** Live FPS + particle-count readout for a fireworks demo. */
export const Hud = ({ handleRef }: { handleRef: RefObject<FireworksHandle | null> }) => {
  const [stats, setStats] = useState<EngineStats | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => {
      const handle = handleRef.current
      if (handle === null) return
      setStats(handle.stats())
    }, 200)
    return () => window.clearInterval(id)
  }, [handleRef])

  if (stats === null) return null

  return (
    <div className="pointer-events-none absolute left-3 top-3 flex gap-3 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-xs backdrop-blur">
      <span className="text-emerald-300">{stats.fps} fps</span>
      <span className="text-white/60">{stats.particles.toLocaleString()} particles</span>
    </div>
  )
}
