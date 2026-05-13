import { MapProvider, RouteRequest, RouteResult } from './types';

export class GoogleMapsProvider implements MapProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'your_google_maps_api_key_here');
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    if (!this.isAvailable()) {
      throw new Error('Google Maps API key not configured');
    }

    const origin = typeof request.origin === 'string'
      ? encodeURIComponent(request.origin)
      : `${request.origin.lat},${request.origin.lng}`;

    const destination = typeof request.destination === 'string'
      ? encodeURIComponent(request.destination)
      : `${request.destination.lat},${request.destination.lng}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${this.apiKey}&language=pt-BR&region=BR`;

    const response = await fetch(url);
    const data = await response.json() as {
      status: string;
      routes: Array<{
        legs: Array<{
          distance: { value: number };
          duration: { value: number };
        }>;
        overview_polyline: { points: string };
      }>;
    };

    if (data.status !== 'OK' || !data.routes.length) {
      throw new Error(`Google Maps error: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distanceKm: leg.distance.value / 1000,
      durationMinutes: leg.duration.value / 60,
      polyline: route.overview_polyline.points,
      provider: 'google',
    };
  }
}
