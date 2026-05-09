import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { authRoutes } from './routes/auth.routes';
import { documentRoutes } from './routes/document.routes';
import { userRoutes } from './routes/user.routes';
import { auditRoutes } from './routes/audit.routes';
import { aiRoutes } from './routes/ai.routes';
import { settingsRoutes } from './routes/settings.routes';
import { qrRoutes } from './routes/qr.routes';
import { searchRoutes } from './routes/search.routes';
import { startCleanupJob } from './services/cleanup.service';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('XATO: JWT_SECRET .env da ko\'rsatilmagan!');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3010').split(',').map(s => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Login uchun qattiq cheklov: 1 daqiqada 10 ta urinish
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Juda ko\'p urinish. 1 daqiqa kuting.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Umumiy API cheklov: 1 daqiqada 200 ta so'rov
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { message: 'Juda ko\'p so\'rov. Biroz kuting.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// QR scan: 1 daqiqada 60 ta (telefon skanerlar uchun)
const qrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Juda ko\'p so\'rov.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/qr', qrLimiter);
app.use('/api', apiLimiter);

// Statik fayllar faqat auth middleware dan keyin route orqali beriladi
// uploads va processed papkalarini to'g'ridan express.static bilan OCHMANG

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/search', searchRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Yo\'l topilmadi' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({ message: err.message || 'Server xatosi' });
});

startCleanupJob();

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda`);
});

export default app;
