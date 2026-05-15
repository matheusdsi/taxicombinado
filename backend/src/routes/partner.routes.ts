import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { partnerClickSchema, partnerLeadSchema, becomePartnerSchema, feedbackSchema } from '../schemas/partner.schema';
import { ZodError } from 'zod';

const router = Router();

const CATEGORY_ALIASES: Record<string, string[]> = {
  fuel_station: ['fuel_station', 'posto', 'postos', 'posto de combustivel', 'posto de combustível'],
  mechanic: ['mechanic', 'oficina', 'oficinas', 'mecanico', 'mecânico', 'mecanica', 'mecânica'],
  car_wash: ['car_wash', 'lavagem', 'lava rapido', 'lava rápido', 'lava-rapido', 'lava-rápido'],
  toll_tag: ['toll_tag', 'tag pedagio', 'tag pedágio', 'pedagio', 'pedágio'],
  vehicle_protection: ['vehicle_protection', 'seguro', 'protecao veicular', 'proteção veicular'],
};

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

// GET /api/partners
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: { isActive: boolean; category?: { in: string[]; mode: 'insensitive' } } = { isActive: true };
    if (category && typeof category === 'string') {
      const normalizedCategory = normalizeCategory(category);
      where.category = {
        in: CATEGORY_ALIASES[normalizedCategory] ?? [category],
        mode: 'insensitive',
      };
    }

    const partners = await prisma.partner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { isPremium: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        wazeUrl: true,
        phone: true,
        whatsapp: true,
        city: true,
        isPremium: true,
        sortOrder: true,
        locations: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            whatsapp: true,
            wazeUrl: true,
            sortOrder: true,
          },
        },
        _count: { select: { clicks: true } },
      },
    });

    return res.json({ success: true, data: partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar parceiros' });
  }
});

// POST /api/partners/click
router.post('/click', async (req: Request, res: Response) => {
  try {
    const input = partnerClickSchema.parse(req.body);
    const dedupeWindow = new Date(Date.now() - 10_000);
    const normalizedSource = input.source?.trim() || null;

    if (input.partnerLocationId) {
      const location = await prisma.partnerLocation.findFirst({
        where: { id: input.partnerLocationId, partnerId: input.partnerId, isActive: true },
        select: { id: true },
      });

      if (!location) {
        return res.status(400).json({ success: false, error: 'Unidade do parceiro invalida' });
      }
    }

    const recentClick = await prisma.partnerClick.findFirst({
      where: {
        partnerId: input.partnerId,
        partnerLocationId: input.partnerLocationId ?? null,
        anonymousId: req.anonymousId ?? null,
        source: normalizedSource,
        createdAt: { gte: dedupeWindow },
      },
      select: { id: true },
    });

    if (recentClick) {
      return res.json({ success: true, deduped: true });
    }

    await prisma.partnerClick.create({
      data: {
        partnerId: input.partnerId,
        partnerLocationId: input.partnerLocationId,
        anonymousId: req.anonymousId,
        source: normalizedSource,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.error('Error tracking click:', error);
    return res.status(500).json({ success: false, error: 'Erro ao registrar clique' });
  }
});

// POST /api/partner-leads
router.post('/leads', async (req: Request, res: Response) => {
  try {
    const input = partnerLeadSchema.parse(req.body);

    const lead = await prisma.partnerLead.create({
      data: {
        partnerId: input.partnerId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        message: input.message,
        anonymousId: req.anonymousId,
        status: 'new',
      },
    });

    return res.status(201).json({ success: true, data: { leadId: lead.id } });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.error('Error creating lead:', error);
    return res.status(500).json({ success: false, error: 'Erro ao registrar interesse' });
  }
});

// POST /api/anuncie - Become a partner form
router.post('/anuncie', async (req: Request, res: Response) => {
  try {
    const input = becomePartnerSchema.parse(req.body);

    // For MVP, store as a feedback/lead in the DB
    // In production, you'd create a pending partner record or send an email
    await prisma.appFeedback.create({
      data: {
        anonymousId: req.anonymousId,
        rating: 5,
        category: 'partner_application',
        message: JSON.stringify(input),
        page: '/anuncie',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Solicitação recebida! Entraremos em contato em breve.',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.error('Error submitting partner application:', error);
    return res.status(500).json({ success: false, error: 'Erro ao enviar solicitação' });
  }
});

// POST /api/feedback
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const input = feedbackSchema.parse(req.body);

    await prisma.appFeedback.create({
      data: {
        anonymousId: req.anonymousId,
        rating: input.rating,
        category: input.category,
        message: input.message,
        page: input.page,
      },
    });

    return res.status(201).json({ success: true, message: 'Obrigado pelo feedback!' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ success: false, error: 'Erro ao enviar feedback' });
  }
});

export default router;
