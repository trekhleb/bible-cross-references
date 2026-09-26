import type { InstancedBufferGeometry } from 'three';
import {
  AdditiveBlending,
  GLSL3,
  LineSegments,
  Mesh,
  NormalBlending,
  OrthographicCamera,
  RawShaderMaterial,
  Scene,
  Vector2,
  type Blending,
  type WebGLRenderer,
} from 'three';
import { GlowCompositor } from '../shared/glow.ts';
import { createCurveGeometry, type CurveKind } from '../shared/instanced-templates.ts';
import { createRenderer, genrePaletteUniform } from '../shared/webgl.ts';
import type { ArcInstances } from './arc-instances.ts';
import type { ArcLayout } from './arc-layout.ts';
import {
  LINE_FRAGMENT_SHADER,
  LINE_VERTEX_SHADER,
  RIBBON_FRAGMENT_SHADER,
  RIBBON_VERTEX_SHADER,
} from './arc-shaders.ts';
import type { AxisView } from './axis-view.ts';

const LINE_SEGMENTS = 48;
const RIBBON_SEGMENTS = 64;

function createGeometry(kind: CurveKind, instances: ArcInstances): InstancedBufferGeometry {
  return createCurveGeometry(
    kind,
    kind === 'line' ? LINE_SEGMENTS : RIBBON_SEGMENTS,
    instances.count,
    {
      a_ends: { array: instances.endpoints, itemSize: 2 },
      a_genres: { array: instances.genres, itemSize: 2 },
      a_weight: { array: instances.weights, itemSize: 1 },
    },
  );
}

const EMPTY: ArcInstances = {
  count: 0,
  endpoints: new Float32Array(0),
  genres: new Float32Array(0),
  weights: new Float32Array(0),
};

type ArcObject =
  | LineSegments<InstancedBufferGeometry, RawShaderMaterial>
  | Mesh<InstancedBufferGeometry, RawShaderMaterial>;

/** Glow brightness while a passage is focused, so its own links stand out. */
const DIMMED_GLOW = 0.28;

/**
 * The WebGL part of the arc diagram, drawn in three passes:
 * 1. every visible link as a hairline, accumulated additively into a half-float buffer;
 * 2. a full-screen pass that tone-maps that glow onto the surface (hue-preserving, so dense
 *    areas deepen in color instead of burning out to white);
 * 3. hovered and focused links as crisp anti-aliased ribbons on top.
 * Labels and the axis are drawn on a 2D overlay by the controller.
 */
export class ArcScene {
  readonly #renderer: WebGLRenderer;
  readonly #glow: GlowCompositor;
  readonly #glowScene = new Scene();
  readonly #overlayScene = new Scene();
  readonly #camera = new OrthographicCamera(); // Shaders output clip space directly.
  readonly #common = {
    u_viewport: { value: new Vector2(1, 1) },
    u_view: { value: new Vector2(0, 1) },
    u_axis: { value: new Vector2(0, 1) },
    u_baseline: { value: 0 },
    u_maxHeight: { value: 0 },
    u_vertical: { value: 0 },
    u_reveal: { value: 1 },
    u_palette: { value: genrePaletteUniform() },
  };
  readonly #lines: ArcObject;
  readonly #hover: ArcObject;
  readonly #focus: ArcObject;

  constructor(canvas: HTMLCanvasElement) {
    this.#renderer = createRenderer(canvas);
    this.#renderer.autoClear = false;
    this.#glow = new GlowCompositor(this.#renderer);

    this.#lines = this.#createObject(this.#glowScene, 'line', AdditiveBlending, 1, 1);
    this.#hover = this.#createObject(this.#overlayScene, 'ribbon', NormalBlending, 0.85, 1.4);
    this.#focus = this.#createObject(this.#overlayScene, 'ribbon', NormalBlending, 0.95, 1.8);
    this.#hover.renderOrder = 1;
    this.#focus.renderOrder = 2;
  }

  setSize(width: number, height: number): void {
    this.#renderer.setSize(width, height, false);
    this.#glow.setSize(width, height);
    this.#common.u_viewport.value.set(width, height);
  }

  setLayout(layout: ArcLayout): void {
    this.#common.u_axis.value.set(layout.axisStart, layout.axisEnd);
    this.#common.u_baseline.value = layout.baseline;
    this.#common.u_maxHeight.value = layout.maxArcHeight;
    this.#common.u_vertical.value = layout.orientation === 'vertical' ? 1 : 0;
    this.#glow.invalidate();
  }

  setView(view: AxisView): void {
    const current = this.#common.u_view.value;
    if (current.x !== view.start || current.y !== view.end) {
      current.set(view.start, view.end);
      this.#glow.invalidate();
    }
  }

  /**
   * All visible links as glowing hairlines. `ceiling` is the accumulated light at which the glow
   * reaches full intensity (see the composite shader).
   */
  setLinks(instances: ArcInstances, ceiling: number): void {
    this.#replace(this.#lines, instances);
    this.#glow.setCeiling(ceiling);
    this.#glow.invalidate();
  }

  /** How much of every arc is drawn, from its source (0–1): the intro animates it. */
  setReveal(reveal: number): void {
    this.#common.u_reveal.value = reveal;
    this.#glow.invalidate();
  }

  /** Dims the glow while something is focused, so the focused links stand out. */
  setDimmed(dimmed: boolean): void {
    this.#glow.setDim(dimmed ? DIMMED_GLOW : 1);
  }

  setHover(instances: ArcInstances | null): void {
    this.#replace(this.#hover, instances ?? EMPTY);
  }

  setFocus(instances: ArcInstances | null): void {
    this.#replace(this.#focus, instances ?? EMPTY);
  }

  render(): void {
    this.#renderer.clear();
    this.#glow.render(this.#glowScene, this.#camera);
    this.#renderer.render(this.#overlayScene, this.#camera);
  }

  dispose(): void {
    for (const object of [this.#lines, this.#hover, this.#focus]) {
      object.geometry.dispose();
      object.material.dispose();
    }
    this.#glow.dispose();
    // No `forceContextLoss()`: a canvas keeps one context for life, and React's development mode
    // remounts effects on the same canvas, so a lost context would break the next renderer.
    this.#renderer.dispose();
  }

  #createObject(
    scene: Scene,
    kind: CurveKind,
    blending: Blending,
    alpha: number,
    width: number,
  ): ArcObject {
    const material = new RawShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: kind === 'line' ? LINE_VERTEX_SHADER : RIBBON_VERTEX_SHADER,
      fragmentShader: kind === 'line' ? LINE_FRAGMENT_SHADER : RIBBON_FRAGMENT_SHADER,
      uniforms: { ...this.#common, u_alpha: { value: alpha }, u_width: { value: width } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending,
    });
    const geometry = createGeometry(kind, EMPTY);
    const object =
      kind === 'line' ? new LineSegments(geometry, material) : new Mesh(geometry, material);
    object.frustumCulled = false;
    object.visible = false;
    scene.add(object);
    return object;
  }

  #replace(object: ArcObject, instances: ArcInstances): void {
    const kind = object instanceof LineSegments ? 'line' : 'ribbon';
    object.geometry.dispose();
    object.geometry = createGeometry(kind, instances);
    object.visible = instances.count > 0;
  }
}
