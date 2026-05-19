import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { anonymousIdMiddleware } from './middleware/anonymousId';
import quoteRoutes from './routes/quote.routes';
import routeRoutes from './routes/route.routes';
import partnerRoutes from './routes/partner.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import placesRoutes from './routes/places.routes';
import accountRoutes from './routes/account.routes';
import rideRequestRoutes from './routes/ride-requests.routes';
import profileRoutes from './routes/profile.routes';
import eventRoutes from './routes/event.routes';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URLS = [
  FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
  'https://www.taxicombinado.com.br',
  'https://taxicombinado.com.br',
  'https://taxicombinado.vercel.app',
]
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...FRONTEND_URLS,
  'http://localhost:3000',
  'http://localhost:3001',
];

// ─── Middleware ───────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Anonymous session tracking
app.use(anonymousIdMiddleware);

// ─── Routes ───────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'taxicombinado-api',
    version: '1.0.0',
  });
});

// API routes
// Quote: /api/quote/calculate + /api/quotes/history + /api/quotes/:id
app.use('/api/quote', quoteRoutes);
app.use('/api/quotes', quoteRoutes);

// Route calculation: /api/route/calculate
app.use('/api/route', routeRoutes);

// Partners: /api/partners (GET), /api/partners/click (POST), /api/partners/leads (POST)
app.use('/api/partners', partnerRoutes);

// Auth (register/login/logout/me)
app.use('/api/auth', authRoutes);

// Driver account center
app.use('/api/account', accountRoutes);

// Admin
app.use('/api/admin', adminRoutes);

// Places autocomplete
app.use('/api/places', placesRoutes);

// Ride requests (passenger booking)
app.use('/api/ride-requests', rideRequestRoutes);

// Driver public profiles + scheduling
app.use('/api/profile', profileRoutes);

// App events (PWA install, etc.)
app.use('/api/app-event', eventRoutes);

// Standalone endpoints that map to partner router handlers
app.use('/api/partner-leads', (req, _res, next) => {
  req.url = '/leads' + req.url;
  next();
}, partnerRoutes);

app.use('/api/feedback', (req, _res, next) => {
  req.url = '/feedback' + req.url;
  next();
}, partnerRoutes);

app.use('/api/anuncie', (req, _res, next) => {
  req.url = '/anuncie' + req.url;
  next();
}, partnerRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
});

// ─── Start ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚖 Taxi Combinado API rodando na porta ${PORT}`);
  console.log(`📡 CORS permitido para: ${FRONTEND_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
});

export default app;
