/** Largest device pixel ratio rendered; higher ratios cost fill rate for no visible gain. */
export const MAX_PIXEL_RATIO = 2;

/**
 * Coalesces render requests into at most one frame, so the scene is drawn only when something
 * changed (no continuous render loop draining phone batteries).
 */
export class FrameScheduler {
  readonly #render: () => void;
  #frame: number | null = null;

  constructor(render: () => void) {
    this.#render = render;
  }

  request(): void {
    this.#frame ??= requestAnimationFrame(() => {
      this.#frame = null;
      this.#render();
    });
  }

  dispose(): void {
    if (this.#frame !== null) {
      cancelAnimationFrame(this.#frame);
      this.#frame = null;
    }
  }
}

/** Runs `onFrame(progress)` with an ease-out curve over `durationMs`; returns a cancel function. */
export function animate(durationMs: number, onFrame: (progress: number) => void): () => void {
  const start = performance.now();
  let frame = requestAnimationFrame(function step(now) {
    const linear = Math.min((now - start) / durationMs, 1);
    onFrame(1 - (1 - linear) ** 3);
    if (linear < 1) {
      frame = requestAnimationFrame(step);
    }
  });
  return () => {
    cancelAnimationFrame(frame);
  };
}
