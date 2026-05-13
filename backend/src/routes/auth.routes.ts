import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';
import { requiredSecret } from '../lib/env';

const router = Router();

const JWT_SECRET = requiredSecret('JWT_SECRET');
const ADMIN_COOKIE = 'pct_admin_session';
const DRIVER_COOKIE = 'pct_driver_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias

// ─── Schemas ──────────────────────────────────────────────────

const adminRegisterSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  adminSecret: z.string().min(1, 'Código de cadastro obrigatório'),
});

const driverRegisterSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

// ─── Helpers ──────────────────────────────────────────────────

function signToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '30d' });
}

function cookieOpts(maxAge = COOKIE_MAX_AGE) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge,
    path: '/',
  };
}

export function getUserFromCookie(req: Request): { sub: string; role: string } | null {
  try {
    const token = req.cookies?.[DRIVER_COOKIE] || req.cookies?.[ADMIN_COOKIE];
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
  } catch {
    return null;
  }
}

// ─── ── TAXISTA ── ────────────────────────────────────────────

// POST /api/auth/driver/register
router.post('/driver/register', async (req: Request, res: Response) => {
  try {
    const input = driverRegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: 'driver' },
    });

    // Vincular cotações anônimas feitas antes do cadastro
    const anonymousId = req.anonymousId;
    if (anonymousId) {
      await prisma.anonymousSession.updateMany({
        where: { sessionId: anonymousId },
        data: { userId: user.id } as any,
      }).catch(() => {});
      await prisma.quote.updateMany({
        where: {
          anonymousSession: { sessionId: anonymousId },
          userId: null,
        },
        data: { userId: user.id },
      }).catch(() => {});
    }

    const token = signToken(user.id, user.role);
    res.cookie(DRIVER_COOKIE, token, cookieOpts());

    return res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Driver register error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao cadastrar.' });
  }
});

// POST /api/auth/driver/login
router.post('/driver/login', async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash || user.role === 'admin') {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    // Vincular cotações anônimas ao user
    const anonymousId = req.anonymousId;
    if (anonymousId) {
      await prisma.quote.updateMany({
        where: {
          anonymousSession: { sessionId: anonymousId },
          userId: null,
        },
        data: { userId: user.id },
      }).catch(() => {});
    }

    const token = signToken(user.id, user.role);
    res.cookie(DRIVER_COOKIE, token, cookieOpts());

    return res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Driver login error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao entrar.' });
  }
});

// POST /api/auth/driver/logout
router.post('/driver/logout', (_req: Request, res: Response) => {
  res.clearCookie(DRIVER_COOKIE, { path: '/' });
  return res.json({ success: true });
});

// GET /api/auth/driver/me
router.get('/driver/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[DRIVER_COOKIE];
    if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });

    const quoteCount = await prisma.quote.count({ where: { userId: user.id } });

    return res.json({ success: true, data: { ...user, quoteCount } });
  } catch {
    return res.status(401).json({ success: false, error: 'Sessão inválida.' });
  }
});

// ─── ── ADMIN ── ──────────────────────────────────────────────

// POST /api/auth/register  (admin)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const input = adminRegisterSchema.parse(req.body);

    let expectedSecret: string;
    try {
      expectedSecret = requiredSecret('ADMIN_SECRET');
    } catch {
      return res.status(403).json({ success: false, error: 'Cadastro de admin desativado.' });
    }

    if (input.adminSecret !== expectedSecret) {
      return res.status(403).json({ success: false, error: 'Código de cadastro inválido.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: 'admin' },
    });

    const token = signToken(user.id, user.role);
    res.cookie(ADMIN_COOKIE, token, cookieOpts());

    return res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Admin register error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao cadastrar.' });
  }
});

// POST /api/auth/login  (admin)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash || user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const token = signToken(user.id, user.role);
    res.cookie(ADMIN_COOKIE, token, cookieOpts());

    return res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao fazer login.' });
  }
});

// POST /api/auth/logout  (admin)
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
  return res.json({ success: true });
});

// GET /api/auth/me  (admin)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token) return res.status(401).json({ success: false, error: 'Não autenticado.' });

    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Não autenticado.' });
    }

    return res.json({ success: true, data: user });
  } catch {
    return res.status(401).json({ success: false, error: 'Sessão inválida.' });
  }
});

export default router;
