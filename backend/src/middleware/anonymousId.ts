import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      anonymousId: string;
      userId: string | null;
    }
  }
}

const ANON_COOKIE = 'pct_anonymous_id';
const DRIVER_COOKIE = 'pct_driver_session';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function anonymousIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ── Resolve logged-in user from driver cookie ──
  req.userId = null;
  try {
    const driverToken = req.cookies?.[DRIVER_COOKIE];
    if (driverToken) {
      const payload = jwt.verify(driverToken, JWT_SECRET) as { sub: string; role: string };
      if (payload.role === 'driver') req.userId = payload.sub;
    }
  } catch { /* token inválido — ignora */ }

  // ── Resolve anonymous id ──
  try {
    let anonymousId = req.cookies?.[ANON_COOKIE] as string | undefined;

    if (!anonymousId || !UUID_RE.test(anonymousId)) {
      anonymousId = uuidv4();

      prisma.anonymousSession
        .create({
          data: {
            sessionId: anonymousId,
            userAgent: req.headers['user-agent'],
            ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip,
            userId: req.userId,
          },
        })
        .catch(() => {});
    } else {
      prisma.anonymousSession
        .updateMany({
          where: { sessionId: anonymousId },
          data: { lastSeen: new Date(), ...(req.userId ? { userId: req.userId } : {}) },
        })
        .catch(() => {});
    }

    res.cookie(ANON_COOKIE, anonymousId, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    req.anonymousId = anonymousId;
    next();
  } catch {
    req.anonymousId = uuidv4();
    next();
  }
}
