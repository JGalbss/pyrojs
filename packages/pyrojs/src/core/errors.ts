import { Data } from "effect"

// Typed error channels for the library. Every failure mode is a tagged error so
// callers can discriminate with `Effect.catchTag` / `Effect.catchTags` instead
// of inspecting strings. Never thrown — always carried in the Effect error
// channel (`Effect.fail`).

/** Configuration that failed schema validation or normalization. */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

/** The target canvas is missing, detached, or has no obtainable 2D context. */
export class CanvasError extends Data.TaggedError("CanvasError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

/** A rendering operation failed (e.g. context lost). */
export class RenderError extends Data.TaggedError("RenderError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

/** A choreography/show step referenced an unknown effect or invalid timing. */
export class ShowError extends Data.TaggedError("ShowError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

/** Union of everything the public API can fail with. */
export type PyroError = ConfigError | CanvasError | RenderError | ShowError
