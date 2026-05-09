import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/logout', authenticate, logout);
authRoutes.get('/me', authenticate, getMe);
