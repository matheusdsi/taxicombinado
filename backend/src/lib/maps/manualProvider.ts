import { MapProvider, RouteRequest, RouteResult } from './types';

export class ManualProvider implements MapProvider {
  isAvailable(): boolean {
    return true;
  }

  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    // Manual provider - the user provides distance and duration directly
    // This is just a pass-through that returns the request data as-is
    // The actual values come from the user's manual input
    return {
      distanceKm: 0,
      durationMinutes: 0,
      provider: 'manual',
    };
  }
}
