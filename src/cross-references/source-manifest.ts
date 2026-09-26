import type { VersificationId } from '../core/bible/versification.ts';
import type { CrossReferenceSourceId } from '../core/datasets/ids.ts';
import type { LicenseInfo } from '../core/datasets/metadata.ts';

/** Describes a cross-reference source plugin. */
export interface CrossReferenceSourceManifest {
  readonly id: CrossReferenceSourceId;
  readonly name: string;
  readonly description: string;
  readonly license: LicenseInfo;
  /** Credit line to display wherever the data is used. */
  readonly attribution: string;
  readonly homepage: string;
  readonly versification: VersificationId;
  /** Whether the source's links are shown before the user changes any settings. */
  readonly enabledByDefault: boolean;
}
