export interface RouteRequest {
  origin: string | { lat: number; lng: number };
  destination: string | { lat: number; lng: number };
  waypoints?: Array<string | { lat: number; lng: number }>;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  returnDistanceKm?: number;
  polyline?: string;
  provider: 'manual' | 'google' | 'mapbox';
}

export interface MapProvider {
  calculateRoute(request: RouteRequest): Promise<RouteResult>;
  isAvailable(): boolean;
}
