import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const ALLOWED_EVENTS = new Set([
  'pwa_install_click',
  'pwa_install_android_outcome',
  'pwa_install_ios_modal_open',
  'pwa_install_ios_modal_close',
]);

router.post('/', async (req: Request, res: Response) => {
  const { eventType, platform, metadata } = req.body ?? {};

  if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
    return res.status(400).json({ success: false, error: 'Evento inválido' });
  }

  try {
    await prisma.appEvent.create({
      data: {
        anonymousId: req.anonymousId ?? null,
        eventType,
        platform: platform ?? null,
        metadata: metadata ?? undefined,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
  } catch (error) {
    console.warn('App event ignored:', error);
  }

  return res.json({ success: true });
});

export default router;
