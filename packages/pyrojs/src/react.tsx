import { useEffect, useRef } from "react"
import type { CSSProperties, ReactElement, RefObject } from "react"
import { createFireworks, type FireworksHandle } from "./core/runtime.js"
import type { FireworksConfigInput } from "./core/config.js"

// React bindings. <Fireworks/> drops a full-screen overlay show in with one line,
// react-confetti style. useFireworks() gives you an imperative handle to launch
// shells on demand. Both reuse the same Effect engine under the hood.

export interface FireworksProps extends FireworksConfigInput {
  /** Whether the show is running. Toggling pauses/resumes. Default true. */
  run?: boolean
  /** Stacking order of the overlay canvas. Default 100. */
  zIndex?: number
  className?: string
  style?: CSSProperties
  /** Receives the imperative handle for manual `launch()` / `finale()`. */
  handleRef?: RefObject<FireworksHandle | null>
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
}

/**
 * Bind a canvas ref to a fireworks engine. Returns a ref to the imperative
 * handle so you can call `handle.current?.launch(...)` from events.
 */
export const useFireworks = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  config?: FireworksConfigInput,
): RefObject<FireworksHandle | null> => {
  const handleRef = useRef<FireworksHandle | null>(null)
  const configKey = JSON.stringify(config ?? {})

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const handle = createFireworks(canvas, config)
    handleRef.current = handle
    return () => {
      handle.destroy()
      handleRef.current = null
    }
    // Create once on mount; live updates flow through the config effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handle = handleRef.current
    if (handle === null || config === undefined) return
    handle.setOptions(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])

  return handleRef
}

/** A drop-in full-screen fireworks overlay. */
export const Fireworks = (props: FireworksProps): ReactElement => {
  const { run = true, zIndex = 100, className, style, handleRef, ...config } = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const internalHandle = useFireworks(canvasRef, config)

  useEffect(() => {
    if (handleRef === undefined) return
    handleRef.current = internalHandle.current
    return () => {
      handleRef.current = null
    }
  }, [handleRef, internalHandle])

  useEffect(() => {
    const handle = internalHandle.current
    if (handle === null) return
    runOrPause(handle, run)
  }, [run, internalHandle])

  return <canvas ref={canvasRef} className={className} style={{ ...overlayStyle, zIndex, ...style }} />
}

const runOrPause = (handle: FireworksHandle, run: boolean): void => {
  if (run) {
    handle.start()
    return
  }
  handle.stop()
}
