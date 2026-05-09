import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes       from './routes/auth.routes';
import companiesRoutes  from './routes/companies.routes';
import paymentsRoutes   from './routes/payments.routes';
import monitoringRoutes from './routes/monitoring.routes';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:7100',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'management-api' }));

app.use('/api/auth',       authRoutes);
app.use('/api/companies',  companiesRoutes);
app.use('/api/payments',   paymentsRoutes);
app.use('/api/monitoring', monitoringRoutes);

export default app;
