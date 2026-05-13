import { MapProvider, RouteRequest, RouteResult } from './types';

export class MapboxProvider implements MapProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'your_mapbox_api_key_here');
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    if (!this.isAvailable()) {
      throw new Error('Mapbox API key not configured');
    }

    const getCoords = (loc: string | { lat: number; lng: number }) => {
      if (typeof loc === 'string') {
        throw new Error('Mapbox provider requires coordinates, not address strings');
      }
      return `${loc.lng},${loc.lat}`;
    };

    const originCoords = getCoords(request.origin);
    const destinationCoords = getCoords(request.destination);

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords};${destinationCoords}?access_token=${this.apiKey}&geometries=polyline`;

    const response = await fetch(url);
    const data = await response.json() as {
      routes: Array<{
        distance: number;
        duration: number;
        geometry: string;
      }>;
    };

    if (!data.routes || !data.routes.length) {
      throw new Error('Mapbox: no routes found');
    }

    const route = data.routes[0];

    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      polyline: route.geometry,
      provider: 'mapbox',
    };
  }
}
