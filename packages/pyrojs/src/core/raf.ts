import { Effect } from "effect"

// requestAnimationFrame as an interruptible Effect. The returned cleanup cancels
// the pending frame if the fiber is interrupted (e.g. on scope close), so the
// engine loop tears down cleanly with no dangling callbacks.
export const requestFrame: Effect.Effect<number> = Effect.async<number>((resume) => {
  const id = requestAnimationFrame((time) => resume(Effect.succeed(time)))
  return Effect.sync(() => cancelAnimationFrame(id))
})
