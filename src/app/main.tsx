import { mount } from '../shared/lib/mount.tsx';
import { VizDataBoundary } from '../visualizations/shared/components/VizDataBoundary.tsx';
import { vizDataLoader } from '../visualizations/shared/viz-data.ts';
import { Explorer } from './Explorer.tsx';
import { registerOfflineCache } from './register-offline-cache.ts';

mount(<VizDataBoundary>{(data) => <Explorer data={data} />}</VizDataBoundary>);

// Once the data has loaded, the offline cache can keep it: from the HTTP cache, not the network.
vizDataLoader.load().then(registerOfflineCache, () => undefined);
