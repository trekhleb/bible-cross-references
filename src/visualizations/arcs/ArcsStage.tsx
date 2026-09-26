import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { formatPassage, passageRange, type Passage } from '../../core/bible/passage.ts';
import { formatInteger } from '../../shared/lib/format.ts';
import { ClickIcon, PinchIcon } from '../../shared/ui/icons.tsx';
import { collectConnections, connectionLinkIds } from '../shared/connections.ts';
import type { LinkFilter } from '../shared/link-filter.ts';
import { useElementSize } from '../shared/use-element-size.ts';
import type { VizData } from '../shared/viz-data.ts';
import { buildArcInstances } from './arc-instances.ts';
import { ArcsController, type ArcHover } from './arcs-controller.ts';
import styles from './ArcsStage.module.css';

interface ArcsStageProps {
  readonly data: VizData;
  /** Whether it's on screen; hidden, it doesn't draw. */
  readonly active: boolean;
  /** Links that pass the filter, drawn as the background. */
  readonly linkIds: Int32Array;
  readonly filter: LinkFilter;
  readonly focus: Passage | null;
  readonly onSelect: (passage: Passage | null) => void;
}

/** The arc diagram: a WebGL layer for arcs, a 2D overlay for the axis, and a hover tooltip. */
export function ArcsStage({ data, active, linkIds, filter, focus, onSelect }: ArcsStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ArcsController | null>(null);
  const size = useElementSize(containerRef);
  const [hover, setHover] = useState<ArcHover | null>(null);
  const select = useEffectEvent((passage: Passage | null) => {
    onSelect(passage);
  });

  useEffect(() => {
    const container = containerRef.current;
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!container || !glCanvas || !overlayCanvas) {
      return undefined;
    }
    const controller = new ArcsController({
      container,
      glCanvas,
      overlayCanvas,
      versification: data.versification,
      onHover: setHover,
      onSelect: (passage) => {
        select(passage);
      },
      onClear: () => {
        select(null);
      },
    });
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [data.versification]);

  useEffect(() => {
    controllerRef.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    controllerRef.current?.setSize(size.width, size.height);
  }, [size]);

  useEffect(() => {
    controllerRef.current?.setLinks(
      buildArcInstances(data.crossReferences.index, linkIds, data.verseGenres),
    );
  }, [data, linkIds]);

  useEffect(() => {
    const { index } = data.crossReferences;
    controllerRef.current?.setLinkResolver((range) =>
      buildArcInstances(
        index,
        connectionLinkIds(collectConnections(index, range, filter, data.verseGenres)),
        data.verseGenres,
      ),
    );
  }, [data, filter]);

  useEffect(() => {
    controllerRef.current?.setFocus(focus && passageRange(focus, data.versification));
  }, [focus, data.versification]);

  return (
    <div
      ref={containerRef}
      className={styles.stage}
      tabIndex={0}
      role="application"
      aria-label="Arc diagram of cross-references. Drag or use the arrow keys to pan, scroll or +/- to zoom, click to focus a passage, Escape to clear."
    >
      <canvas ref={glCanvasRef} className={styles.canvas} />
      <canvas ref={overlayCanvasRef} className={styles.canvas} aria-hidden="true" />
      {hover && <HoverTooltip hover={hover} data={data} filter={filter} size={size} />}
    </div>
  );
}

/** The tooltip sits this far from the pointer, and keeps room for its largest size near the edges. */
const TOOLTIP = { offset: 14, width: 200, height: 80 };

function HoverTooltip({
  hover,
  data,
  filter,
  size,
}: {
  readonly hover: ArcHover;
  readonly data: VizData;
  readonly filter: LinkFilter;
  readonly size: { readonly width: number; readonly height: number };
}) {
  const { versification, crossReferences, verseGenres } = data;
  const count = useMemo(() => {
    const connections = collectConnections(
      crossReferences.index,
      passageRange(hover.passage, versification),
      filter,
      verseGenres,
    );
    return connectionLinkIds(connections).length;
  }, [crossReferences.index, hover.passage, versification, filter, verseGenres]);
  const left = Math.min(hover.x + TOOLTIP.offset, size.width - TOOLTIP.width);
  const top = Math.max(Math.min(hover.y + TOOLTIP.offset, size.height - TOOLTIP.height), 8);
  return (
    <div className={styles.tooltip} style={{ left, top }}>
      <strong>{formatPassage(hover.passage, versification)}</strong>
      <span>
        {formatInteger(count)} {count === 1 ? 'connection' : 'connections'}
      </span>
      <span className={styles.gestures}>
        <ClickIcon /> to focus · <PinchIcon /> to zoom
      </span>
    </div>
  );
}
