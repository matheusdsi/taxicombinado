import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { partnerClickSchema, partnerLeadSchema, becomePartnerSchema, feedbackSchema } from '../schemas/partner.schema';
import { ZodError } from 'zod';

const router = Router();

// GET /api/partners
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: { isActive: boolean; category?: string } = { isActive: true };
    if (category && typeof category === 'string') {
      where.category = category;
    }

    const partners = await prisma.partner.findMany({
      where,
      orderBy: [{ isPremium: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        phone: true,
        city: true,
        isPremium: true,
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

    await prisma.partnerClick.create({
      data: {
        partnerId: input.partnerId,
        anonymousId: req.anonymousId,
        source: input.source,
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
