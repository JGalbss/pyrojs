import { useEffect, useRef } from "react"
import type { CSSProperties, RefObject } from "react"
import { useFireworks } from "pyrojs/react"
import type { FireworksConfigInput, FireworksHandle } from "pyrojs"

interface FireworksCanvasProps {
  config?: FireworksConfigInput
  className?: string
  style?: CSSProperties
  handleRef?: RefObject<FireworksHandle | null>
}

const canvasStyle: CSSProperties = { width: "100%", height: "100%", display: "block" }

/** A contained, responsive fireworks canvas that fills its parent. */
export const FireworksCanvas = ({
  config,
  className,
  style,
  handleRef,
}: FireworksCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useFireworks(canvasRef, config)

  useEffect(() => {
    if (handleRef === undefined) return
    handleRef.current = handle.current
  })

  return <canvas ref={canvasRef} className={className} style={{ ...canvasStyle, ...style }} />
}
