import { Color, Vector3, WebGLRenderer } from 'three';
import { MAX_PIXEL_RATIO } from './frames.ts';
import { GENRE_RGB, VIZ_SURFACE } from './palette.ts';

export function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setClearColor(new Color(VIZ_SURFACE), 1);
  return renderer;
}

/** Genre palette as a `vec3[10]` uniform value. */
export function genrePaletteUniform(): Vector3[] {
  return GENRE_RGB.map(([red, green, blue]) => new Vector3(red, green, blue));
}
