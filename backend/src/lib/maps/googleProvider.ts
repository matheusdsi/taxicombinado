import { MapProvider, RouteRequest, RouteResult, RouteStep } from './types';

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

    const waypointsParam = request.waypoints?.length
      ? `&waypoints=${request.waypoints.map((w) =>
          typeof w === 'string' ? encodeURIComponent(w) : `${w.lat},${w.lng}`
        ).join('|')}`
      : '';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&key=${this.apiKey}&language=pt-BR&region=BR&departure_time=now&traffic_model=best_guess`;

    const response = await fetch(url);
    const data = await response.json() as {
      status: string;
      routes: Array<{
        legs: Array<{
          distance: { value: number };
          duration: { value: number };
          duration_in_traffic?: { value: number };
          steps: Array<{
            html_instructions: string;
            distance: { value: number };
            duration: { value: number };
          }>;
        }>;
        overview_polyline: { points: string };
      }>;
    };

    if (data.status !== 'OK' || !data.routes.length) {
      throw new Error(`Google Maps error: ${data.status}`);
    }

    const route = data.routes[0];

    const totalDistanceM = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const baseDurationS = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);
    const trafficDurationS = route.legs.reduce(
      (sum, leg) => sum + (leg.duration_in_traffic ?? leg.duration).value,
      0
    );
    const steps: RouteStep[] = route.legs.flatMap((leg) =>
      leg.steps.map((s) => ({
        instruction: s.html_instructions.replace(/<[^>]+>/g, ''),
        distanceKm: s.distance.value / 1000,
        durationMinutes: s.duration.value / 60,
      }))
    );

    return {
      distanceKm: totalDistanceM / 1000,
      durationMinutes: trafficDurationS / 60,
      baseDurationMinutes: baseDurationS / 60,
      polyline: route.overview_polyline.points,
      provider: 'google',
      steps,
    };
  }
}
