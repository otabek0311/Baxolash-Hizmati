import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { globalSearch } from '../controllers/search.controller';

export const searchRoutes = Router();
searchRoutes.get('/', authenticate, globalSearch);
