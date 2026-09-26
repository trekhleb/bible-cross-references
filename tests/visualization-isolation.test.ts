import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Architecture test: each visualization may import core code, plugins and
 * `src/visualizations/shared/`, but never another visualization, and shared code never imports a
 * visualization. Only the app (`src/app/views.ts`) connects them, so removing a visualization
 * means deleting its folder and its line there.
 */
const ROOT = join(import.meta.dirname, '../src/visualizations');
const SHARED = 'shared';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const visualizations = readdirSync(ROOT).filter(
  (name) => name !== SHARED && statSync(join(ROOT, name)).isDirectory(),
);

describe('visualization isolation', () => {
  it('finds the visualizations', () => {
    expect(visualizations).toEqual(expect.arrayContaining(['arcs', 'threads']));
  });

  it.each([...visualizations, SHARED])('%s imports no visualization but itself', (folder) => {
    const forbidden = visualizations.filter((other) => other !== folder);
    const violations = sourceFiles(join(ROOT, folder)).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)]
        .map((match) => match[1] ?? '')
        .filter((specifier) => forbidden.some((other) => specifier.includes(`/${other}/`)))
        .map((specifier) => `${relative(ROOT, file)} → ${specifier}`),
    );
    expect(violations).toEqual([]);
  });
});
