import { Router, Request, Response } from 'express';
import { calculateTaxiQuote } from '../lib/calculateTaxiQuote';
import { prisma } from '../lib/prisma';
import { calculateQuoteSchema, quoteHistoryQuerySchema } from '../schemas/quote.schema';
import { ZodError } from 'zod';

const router = Router();

// POST /api/quote/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const input = calculateQuoteSchema.parse(req.body);

    const result = calculateTaxiQuote({
      distanceKm: input.distanceKm,
      returnDistanceKm: input.returnDistanceKm,
      totalDistanceKm: input.totalDistanceKm,
      estimatedMinutes: input.estimatedMinutes,
      tripType: input.tripType,
      consumptionKmPerLiter: input.consumptionKmPerLiter,
      fuelPricePerLiter: input.fuelPricePerLiter,
      vehicleExtraCostPerKm: input.vehicleExtraCostPerKm,
      baseFare: input.baseFare,
      pricePerKm: input.pricePerKm,
      waitingPrice: input.waitingPrice,
      waitingChargeType: input.waitingChargeType,
      flagMultiplier: input.flagMultiplier,
      tollOutbound: input.tollOutbound,
      tollReturn: input.tollReturn,
      parkingCost: input.parkingCost,
      extraCosts: input.extraCosts,
      desiredMarginPercent: input.desiredMarginPercent,
      driverMinimumValue: input.driverMinimumValue,
      customChargedPrice: input.customChargedPrice,
    });

    // Try to persist — if DB is unavailable, still return the result
    let quoteId = 'local-' + Date.now();
    try {
      const anonymousId = req.anonymousId;
      let anonymousSessionId: string | null = null;
      if (anonymousId) {
        const session = await prisma.anonymousSession.findUnique({ where: { sessionId: anonymousId } });
        if (session) anonymousSessionId = session.id;
      }

      const userId = req.userId ?? null;

      const quote = await prisma.quote.create({
        data: {
          userId,
          anonymousSessionId,
          originAddress: input.originAddress,
          destinationAddress: input.destinationAddress,
          tripType: input.tripType,
          routeMode: input.routeMode,
          distanceKm: result.distanceKm,
          returnDistanceKm: result.returnDistanceKm,
          totalDistanceKm: result.totalDistanceKm,
          estimatedMinutes: result.estimatedMinutes,
          consumptionKmPerLiter: input.consumptionKmPerLiter,
          fuelPricePerLiter: input.fuelPricePerLiter,
          fuelType: input.fuelType,
          vehicleExtraCostPerKm: input.vehicleExtraCostPerKm,
          baseFare: input.baseFare,
          pricePerKm: input.pricePerKm,
          waitingPrice: input.waitingPrice,
          waitingChargeType: input.waitingChargeType,
          flagMultiplier: input.flagMultiplier,
          tollOutbound: input.tollOutbound,
          tollReturn: input.tollReturn,
          parkingCost: input.parkingCost,
          extraCosts: input.extraCosts,
          desiredMarginPercent: input.desiredMarginPercent,
          driverMinimumValue: input.driverMinimumValue,
          customChargedPrice: input.customChargedPrice,
          fuelCost: result.fuelCost,
          vehicleExtraCost: result.vehicleExtraCost,
          tollTotal: result.tollTotal,
          totalCost: result.totalCost,
          timeCharge: result.timeCharge,
          farePrice: result.farePrice,
          minimumPrice: result.minimumPrice,
          recommendedPrice: result.recommendedPrice,
          idealPrice: result.idealPrice,
          profit: result.profit,
          margin: result.margin,
          alerts: result.alerts as object[],
          source: input.source ?? null,
          stops: input.stops?.length
            ? { create: input.stops.map((address, index) => ({ order: index, address })) }
            : undefined,
        },
        include: { stops: true },
      });

      await prisma.quoteEvent.create({
        data: {
          quoteId: quote.id,
          eventType: 'calculated',
          metadata: { tripType: input.tripType, routeMode: input.routeMode },
        },
      });

      quoteId = quote.id;
    } catch (dbError) {
      // DB unavailable — calculation still succeeds, just not persisted
      console.warn('DB unavailable, quote not persisted:', dbError instanceof Error ? dbError.message : dbError);
    }

    return res.status(201).json({ success: true, data: { quoteId, result } });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.error('Error calculating quote:', error instanceof Error ? error.message : error);
    return res.status(500).json({ success: false, error: 'Erro interno ao calcular a corrida' });
  }
});

// POST /api/quotes/sync — bulk-import local quotes for the authenticated user
router.post('/sync', async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: 'Autenticação necessária' });
  }

  const { quotes } = req.body as { quotes?: unknown[] };
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return res.json({ success: true, data: { synced: 0 } });
  }

  let synced = 0;
  for (const q of quotes as Record<string, unknown>[]) {
    try {
      if (!q.id || !q.createdAt) continue;
      // Skip already-persisted server IDs (UUIDs), only sync local-* or short ids
      const isLocalId = typeof q.id === 'string' && (q.id.startsWith('local-') || q.id.length < 20);
      if (!isLocalId) continue;

      await prisma.quote.create({
        data: {
          userId: req.userId,
          originAddress: (q.originAddress as string) || null,
          destinationAddress: (q.destinationAddress as string) || null,
          tripType: (q.tripType as string) || 'one_way',
          routeMode: 'manual',
          distanceKm: Number(q.distanceKm) || 0,
          returnDistanceKm: 0,
          totalDistanceKm: Number(q.distanceKm) || 0,
          estimatedMinutes: 0,
          consumptionKmPerLiter: 0,
          fuelPricePerLiter: 0,
          fuelType: 'gasolina',
          vehicleExtraCostPerKm: 0,
          baseFare: 0,
          pricePerKm: 0,
          waitingPrice: 0,
          waitingChargeType: 'per_minute',
          flagMultiplier: 1,
          tollOutbound: 0,
          tollReturn: 0,
          parkingCost: 0,
          extraCosts: 0,
          desiredMarginPercent: 0,
          driverMinimumValue: 0,
          fuelCost: 0,
          vehicleExtraCost: 0,
          tollTotal: 0,
          totalCost: Number(q.totalCost) || 0,
          timeCharge: 0,
          farePrice: 0,
          minimumPrice: 0,
          recommendedPrice: Number(q.recommendedPrice) || 0,
          idealPrice: 0,
          profit: Number(q.profit) || 0,
          margin: Number(q.margin) || 0,
          alerts: [],
          createdAt: new Date(q.createdAt as string),
        },
      });
      synced++;
    } catch {
      // skip individual failures — best-effort
    }
  }

  return res.json({ success: true, data: { synced } });
});

// GET /api/quotes/history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const query = quoteHistoryQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    // Taxista logado → busca por userId (inclui todos os dispositivos)
    if (req.userId) {
      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where: { userId: req.userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
          include: { stops: true },
        }),
        prisma.quote.count({ where: { userId: req.userId } }),
      ]);
      return res.json({ success: true, data: { quotes, total, page: query.page, totalPages: Math.ceil(total / query.limit) } });
    }

    // Anônimo → busca por anonymous session
    const anonymousId = req.anonymousId;
    if (!anonymousId) return res.json({ success: true, data: { quotes: [], total: 0 } });

    const session = await prisma.anonymousSession.findUnique({ where: { sessionId: anonymousId } });
    if (!session) return res.json({ success: true, data: { quotes: [], total: 0 } });

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { anonymousSessionId: session.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        include: { stops: true },
      }),
      prisma.quote.count({ where: { anonymousSessionId: session.id } }),
    ]);

    return res.json({ success: true, data: { quotes, total, page: query.page, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Parâmetros inválidos', details: error.errors });
    }
    console.error('Error fetching history:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar histórico' });
  }
});

// GET /api/quotes/popular
router.get('/popular', async (_req: Request, res: Response) => {
  try {
    const popular = await prisma.quote.groupBy({
      by: ['destinationAddress'],
      _count: { id: true },
      where: { destinationAddress: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return res.json({
      success: true,
      data: popular.map((r) => ({
        origin: null,
        destination: r.destinationAddress,
        count: r._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar rotas populares' });
  }
});

// GET /api/quotes/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { stops: true, events: true },
    });

    if (!quote) return res.status(404).json({ success: false, error: 'Cotação não encontrada' });

    // Só o dono pode ver
    const isOwner =
      (req.userId && quote.userId === req.userId) ||
      (!req.userId && quote.anonymousSessionId &&
        (await prisma.anonymousSession.findUnique({ where: { id: quote.anonymousSessionId } }))?.sessionId === req.anonymousId);

    if (!isOwner) return res.status(403).json({ success: false, error: 'Sem acesso a esta cotação.' });

    return res.json({ success: true, data: quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar cotação' });
  }
});

export default router;
