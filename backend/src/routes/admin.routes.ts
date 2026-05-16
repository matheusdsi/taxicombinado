import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';
import { getFlags, setFlag } from '../lib/featureFlags';
import { requiredSecret } from '../lib/env';

const router = Router();
const JWT_SECRET = requiredSecret('JWT_SECRET');
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

const adminPartnerSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  wazeUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const adminPartnerUpdateSchema = adminPartnerSchema.partial();

const adminPartnerLocationSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  wazeUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const adminPartnerLocationUpdateSchema = adminPartnerLocationSchema.partial();

function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const last7 = new Date(today.getTime() - 7 * 86400000);
    const last30 = new Date(today.getTime() - 30 * 86400000);

    const nonChallengeWhere = { OR: [{ source: null }, { source: { not: 'challenge' } }] };

    const [
      totalQuotes,
      quotesToday,
      quotesYesterday,
      quotesLast7,
      quotesLast30,
      challengesTotal,
      challengesToday,
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
      prisma.quote.count({ where: nonChallengeWhere }),
      prisma.quote.count({ where: { ...nonChallengeWhere, createdAt: { gte: today } } }),
      prisma.quote.count({ where: { ...nonChallengeWhere, createdAt: { gte: yesterday, lt: today } } }),
      prisma.quote.count({ where: { ...nonChallengeWhere, createdAt: { gte: last7 } } }),
      prisma.quote.count({ where: { ...nonChallengeWhere, createdAt: { gte: last30 } } }),
      prisma.quote.count({ where: { source: 'challenge' } }),
      prisma.quote.count({ where: { source: 'challenge', createdAt: { gte: today } } }),
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

    // Recent quotes (exclude challenge quotes)
    const recentQuotes = await prisma.quote.findMany({
      where: nonChallengeWhere,
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
        farePrice: true,
        totalCost: true,
        profit: true,
        margin: true,
        fuelType: true,
        routeMode: true,
        desiredMarginPercent: true,
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
          challengesTotal,
          challengesToday,
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

// ─── GET /api/admin/quotes ────────────────────────────────────
router.get('/quotes', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const filter = String(req.query.filter ?? 'all');

    const nonChallenge = { OR: [{ source: null }, { source: { not: 'challenge' } }] };
    const where: Record<string, unknown> = { ...nonChallenge };
    if (filter === 'today') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      where.createdAt = { gte: startOfDay, lt: endOfDay };
    }

    const [total, quotes] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          originAddress: true,
          destinationAddress: true,
          tripType: true,
          distanceKm: true,
          recommendedPrice: true,
          farePrice: true,
          totalCost: true,
          profit: true,
          margin: true,
          fuelType: true,
          routeMode: true,
          desiredMarginPercent: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: { quotes, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin quotes error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar cotações' });
  }
});

// ─── GET /api/admin/settings ──────────────────────────────────
router.get('/settings', (_req: Request, res: Response) => {
  return res.json({ success: true, data: getFlags() });
});

// ─── POST /api/admin/settings ─────────────────────────────────
router.post('/settings', (req: Request, res: Response) => {
  const { showRouteSteps } = req.body as { showRouteSteps?: boolean };
  if (typeof showRouteSteps === 'boolean') {
    setFlag('showRouteSteps', showRouteSteps);
  }
  return res.json({ success: true, data: getFlags() });
});

// ─── GET /api/admin/partners ─────────────────────────────────────
router.get('/partners', async (_req: Request, res: Response) => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { isPremium: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { clicks: true, leads: true } },
        locations: {
          orderBy: [{ sortOrder: 'asc' }, { isActive: 'desc' }, { name: 'asc' }],
          include: {
            _count: { select: { clicks: true } },
          },
        },
      },
    });

    const clickSources = await prisma.partnerClick.groupBy({
      by: ['partnerId', 'partnerLocationId', 'source'],
      where: { partnerId: { in: partners.map((partner) => partner.id) } },
      _count: { _all: true },
    });

    const clickSourceMap = clickSources.reduce<Record<string, Record<string, number>>>((acc, item) => {
      const key = item.partnerLocationId ? `${item.partnerId}:${item.partnerLocationId}` : item.partnerId;
      acc[key] = acc[key] || {};
      acc[key][item.source || 'unknown'] = item._count._all;
      return acc;
    }, {});

    const partnersWithClickSources = partners.map((partner) => ({
      ...partner,
      clickSources: clickSourceMap[partner.id] || {},
      locations: partner.locations.map((location) => ({
        ...location,
        clickSources: clickSourceMap[`${partner.id}:${location.id}`] || {},
      })),
    }));

    return res.json({ success: true, data: partnersWithClickSources });
  } catch (error) {
    console.error('Admin partners list error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar parceiros' });
  }
});

// ─── POST /api/admin/partners ────────────────────────────────────
router.post('/partners', async (req: Request, res: Response) => {
  try {
    const input = adminPartnerSchema.parse(req.body);

    const partner = await prisma.partner.create({
      data: {
        name: input.name.trim(),
        category: input.category.trim(),
        description: emptyToNull(input.description),
        logoUrl: emptyToNull(input.logoUrl),
        websiteUrl: emptyToNull(input.websiteUrl),
        wazeUrl: emptyToNull(input.wazeUrl),
        phone: emptyToNull(input.phone),
        whatsapp: emptyToNull(input.whatsapp),
        city: emptyToNull(input.city),
        isActive: input.isActive ?? true,
        isPremium: input.isPremium ?? false,
        sortOrder: input.sortOrder ?? 0,
      },
      include: {
        _count: { select: { clicks: true, leads: true } },
        locations: true,
      },
    });

    return res.status(201).json({ success: true, data: partner });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: error.errors });
    }
    console.error('Admin partner create error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao cadastrar parceiro' });
  }
});

// ─── PATCH /api/admin/partners/:id ───────────────────────────────
router.patch('/partners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input = adminPartnerUpdateSchema.parse(req.body);

    const data: Record<string, string | number | boolean | null> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.category !== undefined) data.category = input.category.trim();
    if (input.description !== undefined) data.description = emptyToNull(input.description);
    if (input.logoUrl !== undefined) data.logoUrl = emptyToNull(input.logoUrl);
    if (input.websiteUrl !== undefined) data.websiteUrl = emptyToNull(input.websiteUrl);
    if (input.wazeUrl !== undefined) data.wazeUrl = emptyToNull(input.wazeUrl);
    if (input.phone !== undefined) data.phone = emptyToNull(input.phone);
    if (input.whatsapp !== undefined) data.whatsapp = emptyToNull(input.whatsapp);
    if (input.city !== undefined) data.city = emptyToNull(input.city);
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.isPremium !== undefined) data.isPremium = input.isPremium;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    const partner = await prisma.partner.update({
      where: { id },
      data,
      include: {
        _count: { select: { clicks: true, leads: true } },
        locations: true,
      },
    });

    return res.json({ success: true, data: partner });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: error.errors });
    }
    console.error('Admin partner update error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao atualizar parceiro' });
  }
});

// ─── POST /api/admin/partners/:id/locations ───────────────────────
router.post('/partners/:id/locations', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input = adminPartnerLocationSchema.parse(req.body);

    const location = await prisma.partnerLocation.create({
      data: {
        partnerId: id,
        name: input.name.trim(),
        address: emptyToNull(input.address),
        city: emptyToNull(input.city),
        phone: emptyToNull(input.phone),
        whatsapp: emptyToNull(input.whatsapp),
        wazeUrl: emptyToNull(input.wazeUrl),
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
      include: {
        _count: { select: { clicks: true } },
      },
    });

    return res.status(201).json({ success: true, data: location });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: error.errors });
    }
    console.error('Admin partner location create error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao cadastrar unidade' });
  }
});

// ─── PATCH /api/admin/partner-locations/:id ───────────────────────
router.patch('/partner-locations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input = adminPartnerLocationUpdateSchema.parse(req.body);

    const data: Record<string, string | number | boolean | null> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.address !== undefined) data.address = emptyToNull(input.address);
    if (input.city !== undefined) data.city = emptyToNull(input.city);
    if (input.phone !== undefined) data.phone = emptyToNull(input.phone);
    if (input.whatsapp !== undefined) data.whatsapp = emptyToNull(input.whatsapp);
    if (input.wazeUrl !== undefined) data.wazeUrl = emptyToNull(input.wazeUrl);
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    const location = await prisma.partnerLocation.update({
      where: { id },
      data,
      include: {
        _count: { select: { clicks: true } },
      },
    });

    return res.json({ success: true, data: location });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: error.errors });
    }
    console.error('Admin partner location update error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao atualizar unidade' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'driver' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { quotes: true } },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      totalQuotes: u._count.quotes,
      lastQuoteAt: u.quotes[0]?.createdAt ?? null,
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar usuários' });
  }
});

// ─── POST /api/admin/users/:id/reset-password ─────────────────
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body as { password?: string };

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Senha deve ter ao menos 6 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'driver') {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao redefinir senha' });
  }
});

function round2(n: number | null | undefined): number | null {
  if (n == null) return null;
  return Math.round(n * 100) / 100;
}

export default router;
