export { ManualProvider } from './manualProvider';
export { GoogleMapsProvider } from './googleProvider';
export { MapboxProvider } from './mapboxProvider';
export type { MapProvider, RouteRequest, RouteResult } from './types';

import { GoogleMapsProvider } from './googleProvider';
import { MapboxProvider } from './mapboxProvider';
import { ManualProvider } from './manualProvider';
import type { MapProvider } from './types';

export function getMapProvider(): MapProvider {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const mapboxKey = process.env.MAPBOX_API_KEY;

  if (googleKey && googleKey !== 'your_google_maps_api_key_here') {
    const provider = new GoogleMapsProvider(googleKey);
    if (provider.isAvailable()) return provider;
  }

  if (mapboxKey && mapboxKey !== 'your_mapbox_api_key_here') {
    const provider = new MapboxProvider(mapboxKey);
    if (provider.isAvailable()) return provider;
  }

  return new ManualProvider();
}
