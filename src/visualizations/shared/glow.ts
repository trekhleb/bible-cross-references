import {
  Color,
  GLSL3,
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  UnsignedByteType,
  Vector3,
  WebGLRenderTarget,
  type Camera,
  type WebGLRenderer,
} from 'three';
import { hexToRgb, VIZ_SURFACE } from './palette.ts';

const COMPOSITE_VERTEX_SHADER = /* glsl */ `
  precision highp float;
  in vec3 position; // a full-screen quad in clip space
  out vec2 v_uv;
  void main() {
    v_uv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Hue-preserving logarithmic tone mapping. Each mark adds light; the brightest channel is
 * compressed as log(1 + light) / log(1 + ceiling) and the other channels scale with it. A lone
 * line stays visible (~10%), while 100 and 1,000 overlapping lines still look different, so
 * dense regions keep their texture and color instead of clipping to white.
 */
const COMPOSITE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D u_accumulated;
  uniform vec3 u_surface;
  uniform float u_ceiling;   // light at which the glow reaches full intensity
  uniform float u_dim;       // 1: normal; lower while something is focused
  in vec2 v_uv;
  out vec4 fragColor;
  void main() {
    vec3 light = texture(u_accumulated, v_uv).rgb;
    float peak = max(max(light.r, light.g), light.b);
    float intensity = clamp(log(1.0 + peak) / log(1.0 + u_ceiling), 0.0, 1.0) * u_dim;
    vec3 glow = peak > 0.0 ? light / peak * intensity : vec3(0.0);
    fragColor = vec4(u_surface + glow * (1.0 - u_surface), 1.0);
  }
`;

const TRANSPARENT_BLACK = new Color(0, 0, 0);

/**
 * Renders many overlapping, additively blended lines into an off-screen buffer (half-float
 * where supported) and composites them onto the surface with tone mapping. The buffer is kept
 * between frames, so hover and focus changes only repeat the cheap composite pass.
 */
export class GlowCompositor {
  readonly #renderer: WebGLRenderer;
  readonly #target: WebGLRenderTarget;
  readonly #quad: Mesh<PlaneGeometry, RawShaderMaterial>;
  readonly #quadScene = new Scene();
  readonly #quadCamera = new OrthographicCamera();
  #dirty = true;

  constructor(renderer: WebGLRenderer) {
    this.#renderer = renderer;
    const { extensions } = renderer;
    const canRenderHalfFloat =
      extensions.has('EXT_color_buffer_float') || extensions.has('EXT_color_buffer_half_float');
    // Without float render targets the glow still works; it just clips in the densest areas.
    this.#target = new WebGLRenderTarget(1, 1, {
      type: canRenderHalfFloat ? HalfFloatType : UnsignedByteType,
      depthBuffer: false,
    });
    const [red, green, blue] = hexToRgb(VIZ_SURFACE);
    this.#quad = new Mesh(
      new PlaneGeometry(2, 2),
      new RawShaderMaterial({
        glslVersion: GLSL3,
        vertexShader: COMPOSITE_VERTEX_SHADER,
        fragmentShader: COMPOSITE_FRAGMENT_SHADER,
        uniforms: {
          u_accumulated: { value: this.#target.texture },
          u_surface: { value: new Vector3(red, green, blue) },
          u_ceiling: { value: 100 },
          u_dim: { value: 1 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.#quad.frustumCulled = false;
    this.#quadScene.add(this.#quad);
  }

  setSize(width: number, height: number): void {
    const ratio = this.#renderer.getPixelRatio();
    this.#target.setSize(
      Math.max(Math.round(width * ratio), 1),
      Math.max(Math.round(height * ratio), 1),
    );
    this.#dirty = true;
  }

  /** Marks the accumulated glow as stale; it is re-rendered on the next `render`. */
  invalidate(): void {
    this.#dirty = true;
  }

  /** Light at which the glow reaches full intensity; scale it with the number of lines. */
  setCeiling(ceiling: number): void {
    this.#setUniform('u_ceiling', ceiling);
  }

  setDim(dim: number): void {
    this.#setUniform('u_dim', dim);
  }

  /** Draws the glow onto the current (screen) framebuffer, re-accumulating it if stale. */
  render(glowScene: Scene, camera: Camera): void {
    const renderer = this.#renderer;
    if (this.#dirty) {
      this.#dirty = false;
      renderer.setRenderTarget(this.#target);
      renderer.setClearColor(TRANSPARENT_BLACK, 0);
      renderer.clear();
      renderer.render(glowScene, camera);
      renderer.setRenderTarget(null);
    }
    renderer.render(this.#quadScene, this.#quadCamera);
  }

  dispose(): void {
    this.#quad.geometry.dispose();
    this.#quad.material.dispose();
    this.#target.dispose();
  }

  #setUniform(name: 'u_ceiling' | 'u_dim', value: number): void {
    const uniform = this.#quad.material.uniforms[name];
    if (uniform) {
      uniform.value = value;
    }
  }
}
