import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z, ZodError } from 'zod';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

// ─── Schemas ─────────────────────────────────────────────────

const upsertProfileSchema = z.object({
  displayName: z.string().min(2).max(80),
  photoUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().max(80).optional(),
  whatsapp: z.string().max(20).optional(),
  car: z.string().max(80).optional(),
  catAirport: z.boolean().default(false),
  catExec: z.boolean().default(false),
  catLuxo: z.boolean().default(false),
  catPet: z.boolean().default(false),
  cat7seats: z.boolean().default(false),
  catTravel: z.boolean().default(false),
  bio: z.string().max(280).optional(),
  lgpdConsent: z.boolean(),
});

const schedulingSchema = z.object({
  passengerName: z.string().min(2).max(100),
  passengerWhatsapp: z.string().min(10).max(20),
  originAddress: z.string().min(5).max(200),
  destinationAddress: z.string().min(5).max(200),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  passengerCount: z.number().int().min(1).max(10).default(1),
  luggageCount: z.number().int().min(0).max(20).default(0),
  notes: z.string().max(500).optional(),
  estimatedPriceMin: z.number().positive().optional(),
  estimatedPriceMax: z.number().positive().optional(),
  estimatedDistanceKm: z.number().positive().optional(),
  passengerConsent: z.boolean().refine((v) => v === true, 'Consentimento obrigatório'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pendente', 'aceito', 'realizado', 'cancelado']),
});

// ─── GET /api/profile/me — perfil do taxista autenticado ─────

router.get('/me', async (req: Request, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, error: 'Autenticação necessária' });

  const profile = await prisma.driverPublicProfile.findUnique({
    where: { userId: req.userId },
  });

  return res.json({ success: true, data: profile });
});

// ─── PUT /api/profile/me — criar ou atualizar perfil ─────────

router.put('/me', async (req: Request, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, error: 'Autenticação necessária' });

  try {
    const data = upsertProfileSchema.parse(req.body);

    if (!data.lgpdConsent) {
      return res.status(400).json({ success: false, error: 'Consentimento LGPD obrigatório para criar perfil público.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });
    const baseSlug = slugify(data.displayName || user?.name || 'taxista');

    // Garante slug único
    const existing = await prisma.driverPublicProfile.findUnique({ where: { userId: req.userId } });
    let slug = existing?.slug ?? baseSlug;
    if (!existing) {
      let candidate = baseSlug;
      let attempt = 0;
      while (await prisma.driverPublicProfile.findUnique({ where: { slug: candidate } })) {
        attempt++;
        candidate = `${baseSlug}-${attempt}`;
      }
      slug = candidate;
    }

    const profile = await prisma.driverPublicProfile.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        slug,
        displayName: data.displayName,
        photoUrl: data.photoUrl || null,
        city: data.city || null,
        whatsapp: data.whatsapp || null,
        car: data.car || null,
        catAirport: data.catAirport,
        catExec: data.catExec,
        catLuxo: data.catLuxo,
        catPet: data.catPet,
        cat7seats: data.cat7seats,
        catTravel: data.catTravel,
        bio: data.bio || null,
        lgpdConsent: true,
        lgpdConsentAt: new Date(),
        isActive: true,
      },
      update: {
        displayName: data.displayName,
        photoUrl: data.photoUrl || null,
        city: data.city || null,
        whatsapp: data.whatsapp || null,
        car: data.car || null,
        catAirport: data.catAirport,
        catExec: data.catExec,
        catLuxo: data.catLuxo,
        catPet: data.catPet,
        cat7seats: data.cat7seats,
        catTravel: data.catTravel,
        bio: data.bio || null,
        lgpdConsent: true,
        lgpdConsentAt: new Date(),
      },
    });

    return res.json({ success: true, data: profile });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: err.errors });
    }
    console.error('Error upserting profile:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ─── DELETE /api/profile/me — remover perfil (direito LGPD) ──

router.delete('/me', async (req: Request, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, error: 'Autenticação necessária' });

  await prisma.driverPublicProfile.deleteMany({ where: { userId: req.userId } });
  return res.json({ success: true });
});

// ─── GET /api/profile/:slug — perfil público (sem auth) ──────

router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  const profile = await prisma.driverPublicProfile.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      displayName: true,
      photoUrl: true,
      city: true,
      car: true,
      catAirport: true,
      catExec: true,
      catLuxo: true,
      catPet: true,
      cat7seats: true,
      catTravel: true,
      bio: true,
      // WhatsApp NÃO é exposto diretamente — apenas o link wa.me é gerado no frontend
      // Isso evita scraping e protege o dado conforme LGPD
    },
  });

  if (!profile) return res.status(404).json({ success: false, error: 'Perfil não encontrado' });

  return res.json({ success: true, data: profile });
});

// ─── GET /api/profile/:slug/whatsapp — link seguro para contato

router.get('/:slug/whatsapp', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { message } = req.query;

  const profile = await prisma.driverPublicProfile.findUnique({
    where: { slug, isActive: true },
    select: { whatsapp: true, displayName: true },
  });

  if (!profile || !profile.whatsapp) {
    return res.status(404).json({ success: false, error: 'Perfil sem WhatsApp configurado' });
  }

  const phone = profile.whatsapp.replace(/\D/g, '');
  const text = encodeURIComponent(
    message ? String(message) : `Olá ${profile.displayName}, vim pelo seu perfil no Taxi Combinado!`
  );
  const link = `https://wa.me/55${phone}?text=${text}`;

  return res.json({ success: true, data: { link } });
});

// ─── POST /api/profile/:slug/schedule — solicitar agendamento ─

router.post('/:slug/schedule', async (req: Request, res: Response) => {
  const { slug } = req.params;

  const profile = await prisma.driverPublicProfile.findUnique({
    where: { slug, isActive: true },
  });

  if (!profile) return res.status(404).json({ success: false, error: 'Perfil não encontrado' });

  try {
    const data = schedulingSchema.parse(req.body);

    const request = await prisma.schedulingRequest.create({
      data: {
        driverProfileId: profile.id,
        passengerName: data.passengerName,
        passengerWhatsapp: data.passengerWhatsapp,
        originAddress: data.originAddress,
        destinationAddress: data.destinationAddress,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        passengerCount: data.passengerCount,
        luggageCount: data.luggageCount,
        notes: data.notes || null,
        estimatedPriceMin: data.estimatedPriceMin ?? null,
        estimatedPriceMax: data.estimatedPriceMax ?? null,
        estimatedDistanceKm: data.estimatedDistanceKm ?? null,
        passengerConsent: data.passengerConsent,
        status: 'pendente',
      },
    });

    return res.status(201).json({ success: true, data: { id: request.id } });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: err.errors });
    }
    console.error('Error creating scheduling request:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ─── GET /api/profile/me/schedules — listar agendamentos do taxista ─

router.get('/me/schedules', async (req: Request, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, error: 'Autenticação necessária' });

  const profile = await prisma.driverPublicProfile.findUnique({ where: { userId: req.userId } });
  if (!profile) return res.json({ success: true, data: [] });

  const requests = await prisma.schedulingRequest.findMany({
    where: { driverProfileId: profile.id },
    orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
  });

  return res.json({ success: true, data: requests });
});

// ─── PATCH /api/profile/me/schedules/:id — atualizar status ──

router.patch('/me/schedules/:id', async (req: Request, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, error: 'Autenticação necessária' });

  const { id } = req.params;

  try {
    const { status } = updateStatusSchema.parse(req.body);

    const profile = await prisma.driverPublicProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil não encontrado' });

    const request = await prisma.schedulingRequest.findFirst({
      where: { id, driverProfileId: profile.id },
    });
    if (!request) return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });

    const updated = await prisma.schedulingRequest.update({
      where: { id },
      data: { status },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: err.errors });
    }
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

export default router;
