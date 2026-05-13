import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const COOKIE_NAME = 'pct_admin_session';

// ─── Auth middleware ──────────────────────────────────────────
async function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Não autenticado.' });
    }
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Sem permissão.' });
    }
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });
  }
}

router.use(requireAdminSession);

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const last7 = new Date(today.getTime() - 7 * 86400000);
    const last30 = new Date(today.getTime() - 30 * 86400000);

    const [
      totalQuotes,
      quotesToday,
      quotesYesterday,
      quotesLast7,
      quotesLast30,
      totalSessions,
      sessionsToday,
      totalPartners,
      totalPartnerClicks,
      partnerClicksToday,
      totalLeads,
      leadsToday,
      totalFeedback,
      avgRating,
    ] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { createdAt: { gte: today } } }),
      prisma.quote.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.quote.count({ where: { createdAt: { gte: last7 } } }),
      prisma.quote.count({ where: { createdAt: { gte: last30 } } }),
      prisma.anonymousSession.count(),
      prisma.anonymousSession.count({ where: { createdAt: { gte: today } } }),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.partnerClick.count(),
      prisma.partnerClick.count({ where: { createdAt: { gte: today } } }),
      prisma.partnerLead.count(),
      prisma.partnerLead.count({ where: { createdAt: { gte: today } } }),
      prisma.appFeedback.count(),
      prisma.appFeedback.aggregate({ _avg: { rating: true } }),
    ]);

    // Aggregates on quotes
    const quoteAggregates = await prisma.quote.aggregate({
      _avg: {
        distanceKm: true,
        totalDistanceKm: true,
        estimatedMinutes: true,
        recommendedPrice: true,
        totalCost: true,
        profit: true,
        margin: true,
        fuelPricePerLiter: true,
        consumptionKmPerLiter: true,
        tollTotal: true,
        desiredMarginPercent: true,
      },
      _min: { recommendedPrice: true, totalCost: true, createdAt: true },
      _max: { recommendedPrice: true, totalCost: true },
    });

    // Trip type breakdown
    const tripTypeRaw = await prisma.quote.groupBy({
      by: ['tripType'],
      _count: { _all: true },
    });
    const tripTypeBreakdown = tripTypeRaw.map((r) => ({
      tripType: r.tripType,
      count: r._count._all,
      percent: totalQuotes > 0 ? Math.round((r._count._all / totalQuotes) * 100) : 0,
    }));

    // Fuel type breakdown
    const fuelTypeRaw = await prisma.quote.groupBy({
      by: ['fuelType'],
      _count: { _all: true },
      orderBy: { _count: { fuelType: 'desc' } },
    });
    const fuelTypeBreakdown = fuelTypeRaw.map((r) => ({
      fuelType: r.fuelType,
      count: r._count._all,
      percent: totalQuotes > 0 ? Math.round((r._count._all / totalQuotes) * 100) : 0,
    }));

    // Route mode breakdown
    const routeModeRaw = await prisma.quote.groupBy({
      by: ['routeMode'],
      _count: { _all: true },
    });
    const routeModeBreakdown = routeModeRaw.map((r) => ({
      routeMode: r.routeMode,
      count: r._count._all,
    }));

    // Quotes per day last 30 days
    const quotesPerDay = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count
      FROM quotes
      WHERE created_at >= ${last30}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Top origins
    const topOrigins = await prisma.$queryRaw<{ origin: string; count: bigint }[]>`
      SELECT origin_address as origin, COUNT(*) as count
      FROM quotes
      WHERE origin_address IS NOT NULL AND origin_address != ''
      GROUP BY origin_address
      ORDER BY count DESC
      LIMIT 10
    `;

    // Top destinations
    const topDestinations = await prisma.$queryRaw<{ destination: string; count: bigint }[]>`
      SELECT destination_address as destination, COUNT(*) as count
      FROM quotes
      WHERE destination_address IS NOT NULL AND destination_address != ''
      GROUP BY destination_address
      ORDER BY count DESC
      LIMIT 10
    `;

    // Price ranges distribution
    const priceRanges = await prisma.$queryRaw<{ range: string; count: bigint }[]>`
      SELECT
        CASE
          WHEN recommended_price < 50 THEN 'Até R$50'
          WHEN recommended_price < 100 THEN 'R$50–100'
          WHEN recommended_price < 200 THEN 'R$100–200'
          WHEN recommended_price < 350 THEN 'R$200–350'
          ELSE 'Acima de R$350'
        END as range,
        COUNT(*) as count
      FROM quotes
      GROUP BY range
      ORDER BY MIN(recommended_price) ASC
    `;

    // Distance ranges
    const distanceRanges = await prisma.$queryRaw<{ range: string; count: bigint }[]>`
      SELECT
        CASE
          WHEN distance_km < 10 THEN 'Até 10 km'
          WHEN distance_km < 30 THEN '10–30 km'
          WHEN distance_km < 60 THEN '30–60 km'
          WHEN distance_km < 100 THEN '60–100 km'
          ELSE 'Acima de 100 km'
        END as range,
        COUNT(*) as count
      FROM quotes
      GROUP BY range
      ORDER BY MIN(distance_km) ASC
    `;

    // Partner clicks per partner
    const partnerClicksBreakdown = await prisma.partnerClick.groupBy({
      by: ['partnerId'],
      _count: { _all: true },
      orderBy: { _count: { partnerId: 'desc' } },
      take: 10,
    });
    const partnerIds = partnerClicksBreakdown.map((p) => p.partnerId);
    const partnersInfo = await prisma.partner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true, category: true },
    });
    const topPartners = partnerClicksBreakdown.map((p) => ({
      ...partnersInfo.find((pi) => pi.id === p.partnerId),
      clicks: p._count._all,
    }));

    // Partner leads breakdown by category (from feedback storing partner applications)
    const leads = await prisma.partnerLead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { partner: { select: { name: true, category: true } } },
    });

    // Recent quotes
    const recentQuotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        originAddress: true,
        destinationAddress: true,
        tripType: true,
        distanceKm: true,
        recommendedPrice: true,
        totalCost: true,
        profit: true,
        margin: true,
        fuelType: true,
        routeMode: true,
      },
    });

    // Recent sessions
    const recentSessions = await prisma.anonymousSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sessionId: true,
        createdAt: true,
        lastSeen: true,
        _count: { select: { quotes: true } },
      },
    });

    // Recent feedback
    const recentFeedback = await prisma.appFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Alerts frequency (from quotes alerts JSON)
    const alertsRaw = await prisma.$queryRaw<{ type: string; count: bigint }[]>`
      SELECT elem->>'type' as type, COUNT(*) as count
      FROM quotes, jsonb_array_elements(alerts::jsonb) as elem
      GROUP BY type
      ORDER BY count DESC
    `;

    // Avg quoted price by day (last 30)
    const avgPricePerDay = await prisma.$queryRaw<{ day: Date; avg_price: number; avg_cost: number; avg_profit: number }[]>`
      SELECT
        DATE_TRUNC('day', created_at) as day,
        ROUND(AVG(recommended_price)::numeric, 2) as avg_price,
        ROUND(AVG(total_cost)::numeric, 2) as avg_cost,
        ROUND(AVG(profit)::numeric, 2) as avg_profit
      FROM quotes
      WHERE created_at >= ${last30}
      GROUP BY day
      ORDER BY day ASC
    `;

    return res.json({
      success: true,
      data: {
        overview: {
          totalQuotes,
          quotesToday,
          quotesYesterday,
          quotesLast7,
          quotesLast30,
          totalSessions,
          sessionsToday,
          totalPartners,
          totalPartnerClicks,
          partnerClicksToday,
          totalLeads,
          leadsToday,
          totalFeedback,
          avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
          firstQuoteAt: quoteAggregates._min.createdAt,
        },
        quoteAverages: {
          distanceKm: round2(quoteAggregates._avg.distanceKm),
          totalDistanceKm: round2(quoteAggregates._avg.totalDistanceKm),
          estimatedMinutes: round2(quoteAggregates._avg.estimatedMinutes),
          recommendedPrice: round2(quoteAggregates._avg.recommendedPrice),
          totalCost: round2(quoteAggregates._avg.totalCost),
          profit: round2(quoteAggregates._avg.profit),
          margin: round2(quoteAggregates._avg.margin),
          fuelPricePerLiter: round2(quoteAggregates._avg.fuelPricePerLiter),
          consumptionKmPerLiter: round2(quoteAggregates._avg.consumptionKmPerLiter),
          tollTotal: round2(quoteAggregates._avg.tollTotal),
          desiredMarginPercent: round2(quoteAggregates._avg.desiredMarginPercent),
          minRecommendedPrice: round2(quoteAggregates._min.recommendedPrice),
          maxRecommendedPrice: round2(quoteAggregates._max.recommendedPrice),
        },
        breakdowns: {
          tripType: tripTypeBreakdown,
          fuelType: fuelTypeBreakdown,
          routeMode: routeModeBreakdown,
          priceRanges: priceRanges.map((r) => ({ ...r, count: Number(r.count) })),
          distanceRanges: distanceRanges.map((r) => ({ ...r, count: Number(r.count) })),
          alertsFrequency: alertsRaw.map((r) => ({ ...r, count: Number(r.count) })),
        },
        timeSeries: {
          quotesPerDay: quotesPerDay.map((r) => ({ day: r.day, count: Number(r.count) })),
          avgPricePerDay,
        },
        geography: {
          topOrigins: topOrigins.map((r) => ({ ...r, count: Number(r.count) })),
          topDestinations: topDestinations.map((r) => ({ ...r, count: Number(r.count) })),
        },
        partners: {
          topPartners,
          recentLeads: leads,
        },
        recentActivity: {
          quotes: recentQuotes,
          sessions: recentSessions,
          feedback: recentFeedback,
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
  }
});

function round2(n: number | null | undefined): number | null {
  if (n == null) return null;
  return Math.round(n * 100) / 100;
}

export default router;
