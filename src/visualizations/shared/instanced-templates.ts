import { BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry } from 'three';

/**
 * Per-vertex templates for instanced curves. The shader turns the parameter `t` (in `position.x`)
 * and, for ribbons, the side (±1, in `position.y`) into a point on each instance's curve.
 */

/** Line segments approximating a curve: `segments` pairs of (t, t + step). For GL_LINES. */
export function curveLineTemplate(segments: number): BufferAttribute {
  const positions = new Float32Array(segments * 2 * 3);
  for (let segment = 0; segment < segments; segment += 1) {
    positions[segment * 6] = segment / segments;
    positions[segment * 6 + 3] = (segment + 1) / segments;
  }
  return new BufferAttribute(positions, 3);
}

/** A ribbon along a curve as indexed triangles: (t, -1) and (t, 1) at each step. */
export function curveRibbonTemplate(segments: number): {
  readonly positions: BufferAttribute;
  readonly index: BufferAttribute;
} {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const index = new Uint16Array(segments * 6);
  for (let step = 0; step <= segments; step += 1) {
    const t = step / segments;
    positions.set([t, -1, 0, t, 1, 0], step * 6);
  }
  for (let segment = 0; segment < segments; segment += 1) {
    const left = segment * 2;
    index.set([left, left + 1, left + 2, left + 1, left + 3, left + 2], segment * 6);
  }
  return { positions: new BufferAttribute(positions, 3), index: new BufferAttribute(index, 1) };
}

export type CurveKind = 'line' | 'ribbon';

/** A fresh instanced geometry for `kind`, with the given per-instance attributes. */
export function createCurveGeometry(
  kind: CurveKind,
  segments: number,
  instanceCount: number,
  attributes: Readonly<Record<string, { readonly array: Float32Array; readonly itemSize: number }>>,
): InstancedBufferGeometry {
  const geometry = new InstancedBufferGeometry();
  if (kind === 'line') {
    geometry.setAttribute('position', curveLineTemplate(segments));
  } else {
    const template = curveRibbonTemplate(segments);
    geometry.setAttribute('position', template.positions);
    geometry.setIndex(template.index);
  }
  for (const [name, { array, itemSize }] of Object.entries(attributes)) {
    geometry.setAttribute(name, new InstancedBufferAttribute(array, itemSize));
  }
  geometry.instanceCount = instanceCount;
  return geometry;
}
