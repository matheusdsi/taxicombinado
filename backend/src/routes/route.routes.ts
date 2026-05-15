import { Router, Request, Response } from 'express';
import { getMapProvider } from '../lib/maps';
import { createRouteCacheKey, getCachedRoute } from '../lib/routeCache';
import { routeCalculateSchema } from '../schemas/quote.schema';
import { ZodError } from 'zod';
import { getFlags } from '../lib/featureFlags';

const router = Router();

// POST /api/route/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const input = routeCalculateSchema.parse(req.body);
    const provider = getMapProvider();

    if (provider.isAvailable() && (provider as { constructor: { name: string } }).constructor.name !== 'ManualProvider') {
      const routeRequest = {
        origin: input.origin,
        destination: input.destination,
        waypoints: input.waypoints,
      };
      const providerName = (provider as { constructor: { name: string } }).constructor.name;
      const cacheKey = createRouteCacheKey(providerName, routeRequest);
      const { result, cacheStatus } = await getCachedRoute(cacheKey, () => provider.calculateRoute(routeRequest));

      const { showRouteSteps } = getFlags();
      return res.json({
        success: true,
        data: {
          distanceKm: result.distanceKm,
          durationMinutes: result.durationMinutes,
          polyline: result.polyline,
          provider: result.provider,
          steps: showRouteSteps ? (result.steps ?? []) : [],
          cache: cacheStatus,
        },
      });
    }

    // Manual mode - no automatic route calculation
    return res.json({
      success: true,
      data: {
        distanceKm: null,
        durationMinutes: null,
        polyline: null,
        provider: 'manual',
        message: 'Modo manual ativo. Insira a distância e duração manualmente.',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.warn('Automatic route calculation unavailable:', error instanceof Error ? error.message : error);
    return res.json({
      success: true,
      data: {
        distanceKm: null,
        durationMinutes: null,
        polyline: null,
        provider: 'manual',
        message: 'Cálculo automático indisponível. Informe a distância manualmente.',
      },
    });
  }
});

export default router;
