import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPayments,
  createPayment,
  createClickLink,
  createPaymeLink,
  clickWebhook,
  paymeWebhook,
} from '../controllers/payments.controller';

const router = Router();

// Webhooks — no auth (called by payment gateways)
router.post('/webhooks/click', clickWebhook);
router.post('/webhooks/payme', paymeWebhook);

// Protected routes
router.get('/company/:companyId',        authenticate, getPayments);
router.post('/company/:companyId',       authenticate, createPayment);
router.post('/company/:companyId/click', authenticate, createClickLink);
router.post('/company/:companyId/payme', authenticate, createPaymeLink);

export default router;
