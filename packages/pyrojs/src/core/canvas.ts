import { Effect, Scope } from "effect"
import { CanvasError } from "./errors.js"

// Browser/DOM integration expressed as Effects. Acquisition can fail with a
// typed CanvasError; observers are scoped resources that detach on scope close.

export const acquireContext = (
  canvas: HTMLCanvasElement,
): Effect.Effect<CanvasRenderingContext2D, CanvasError> =>
  Effect.suspend(() => {
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      return Effect.fail(
        new CanvasError({ message: "Canvas 2D context is unavailable on this element" }),
      )
    }
    return Effect.succeed(ctx)
  })

export const devicePixelRatioOf = (): number => {
  if (typeof window === "undefined") return 1
  const dpr = window.devicePixelRatio
  if (dpr > 0) return dpr
  return 1
}

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Track an element's size, invoking `onResize` immediately and on every change. */
export const observeSize = (
  element: HTMLElement,
  onResize: (width: number, height: number, dpr: number) => void,
): Effect.Effect<void, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const measure = (): void =>
        onResize(element.clientWidth, element.clientHeight, devicePixelRatioOf())
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return observer
    }),
    (observer) => Effect.sync(() => observer.disconnect()),
  ).pipe(Effect.asVoid)

/** Invoke `onChange(hidden)` whenever the document's visibility changes. */
export const observeVisibility = (
  onChange: (hidden: boolean) => void,
): Effect.Effect<void, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const handler = (): void => onChange(document.hidden)
      document.addEventListener("visibilitychange", handler)
      return handler
    }),
    (handler) => Effect.sync(() => document.removeEventListener("visibilitychange", handler)),
  ).pipe(Effect.asVoid)
