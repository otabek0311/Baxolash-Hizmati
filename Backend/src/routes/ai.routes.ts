import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { chat, getHistory, clearHistory } from '../controllers/ai.controller';

export const aiRoutes = Router();

aiRoutes.use(authenticate);

aiRoutes.post('/chat', chat);
aiRoutes.get('/history', getHistory);
aiRoutes.delete('/history', clearHistory);
