import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCompanyStats, getRecentMetrics } from '../controllers/monitoring.controller';

const router = Router();

router.use(authenticate);

router.get('/companies/:id/stats',   getCompanyStats);
router.get('/companies/:id/metrics', getRecentMetrics);

export default router;
