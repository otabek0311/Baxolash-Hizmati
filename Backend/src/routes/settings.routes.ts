import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getSettings, updateSettings } from '../controllers/settings.controller';

export const settingsRoutes = Router();

settingsRoutes.get('/', authenticate, getSettings);
settingsRoutes.put('/', authenticate, authorize('SUPERADMIN'), updateSettings);
