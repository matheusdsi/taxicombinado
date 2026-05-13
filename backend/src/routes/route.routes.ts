import { Router, Request, Response } from 'express';
import { getMapProvider } from '../lib/maps';
import { routeCalculateSchema } from '../schemas/quote.schema';
import { ZodError } from 'zod';

const router = Router();

// POST /api/route/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const input = routeCalculateSchema.parse(req.body);
    const provider = getMapProvider();

    if (provider.isAvailable() && (provider as { constructor: { name: string } }).constructor.name !== 'ManualProvider') {
      const result = await provider.calculateRoute({
        origin: input.origin,
        destination: input.destination,
        waypoints: input.waypoints,
      });

      return res.json({
        success: true,
        data: {
          distanceKm: result.distanceKm,
          durationMinutes: result.durationMinutes,
          polyline: result.polyline,
          provider: result.provider,
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
    console.error('Error calculating route:', error);
    return res.status(500).json({ success: false, error: 'Erro ao calcular rota' });
  }
});

export default router;
