import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import {
  createClickPayment,
  createPaymePayment,
} from '../services/payment.service';

// GET /api/payments/company/:companyId
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('getPayments error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/payments/company/:companyId
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { amount, method, periodStart, periodEnd, transactionId } = req.body;

    if (!amount || !method || !periodStart || !periodEnd) {
      res.status(400).json({ message: 'amount, method, periodStart, periodEnd majburiy' });
      return;
    }

    const validMethods = ['CLICK', 'PAYME', 'BANK_TRANSFER'];
    if (!validMethods.includes(method)) {
      res.status(400).json({ message: `method qiymatlari: ${validMethods.join(', ')}` });
      return;
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        companyId,
        amount: parseFloat(String(amount)),
        currency: company.currency,
        method,
        status: method === 'BANK_TRANSFER' ? 'PAID' : 'PENDING',
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        transactionId: transactionId || null,
        paidAt: method === 'BANK_TRANSFER' ? new Date() : null,
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('createPayment error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/payments/company/:companyId/click
export const createClickLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      res.status(400).json({ message: 'amount majburiy' });
      return;
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const paymentUrl = await createClickPayment(companyId, parseFloat(String(amount)));

    // Save pending payment record
    const payment = await prisma.payment.create({
      data: {
        companyId,
        amount: parseFloat(String(amount)),
        currency: company.currency,
        method: 'CLICK',
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentUrl,
      },
    });

    res.json({ paymentUrl, payment });
  } catch (error) {
    console.error('createClickLink error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/payments/company/:companyId/payme
export const createPaymeLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      res.status(400).json({ message: 'amount majburiy' });
      return;
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const paymentUrl = await createPaymePayment(companyId, parseFloat(String(amount)));

    // Save pending payment record
    const payment = await prisma.payment.create({
      data: {
        companyId,
        amount: parseFloat(String(amount)),
        currency: company.currency,
        method: 'PAYME',
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentUrl,
      },
    });

    res.json({ paymentUrl, payment });
  } catch (error) {
    console.error('createPaymeLink error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/payments/webhooks/click
export const clickWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id: companyId,
      amount,
      action,
      error,
      sign_time,
      sign_string,
    } = req.body;

    const secretKey = process.env.CLICK_SECRET_KEY || '';
    const serviceId = process.env.CLICK_SERVICE_ID || '';

    // Verify signature
    const expectedSign = crypto
      .createHash('md5')
      .update(`${click_trans_id}${serviceId}${secretKey}${companyId}${amount}${action}${sign_time}`)
      .digest('hex');

    if (sign_string !== expectedSign) {
      res.json({ error: -1, error_note: 'SIGN CHECK FAILED!' });
      return;
    }

    if (error < 0) {
      // Payment failed
      await prisma.payment.updateMany({
        where: { companyId, status: 'PENDING', method: 'CLICK' },
        data: { status: 'FAILED' },
      });
      res.json({ error: 0, error_note: 'Success' });
      return;
    }

    if (action === 1) {
      // Prepare — just confirm
      res.json({
        click_trans_id,
        merchant_trans_id: companyId,
        error: 0,
        error_note: 'Success',
      });
      return;
    }

    if (action === 2) {
      // Confirm — mark as paid
      const updated = await prisma.payment.updateMany({
        where: { companyId, status: 'PENDING', method: 'CLICK' },
        data: {
          status: 'PAID',
          transactionId: click_trans_id?.toString(),
          paidAt: new Date(),
          gatewayData: req.body,
        },
      });

      if (updated.count === 0) {
        res.json({ error: -6, error_note: 'Transaction not found' });
        return;
      }

      res.json({
        click_trans_id,
        merchant_trans_id: companyId,
        error: 0,
        error_note: 'Success',
      });
      return;
    }

    res.json({ error: -3, error_note: 'Action not found' });
  } catch (error) {
    console.error('clickWebhook error:', error);
    res.status(500).json({ error: -9, error_note: 'Server error' });
  }
};

// POST /api/payments/webhooks/payme
export const paymeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { method, params, id } = req.body;

    // Verify Basic Auth
    const authHeader = req.headers.authorization || '';
    const base64 = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const [, password] = decoded.split(':');

    if (password !== process.env.PAYME_SECRET_KEY) {
      res.json({
        id,
        error: {
          code: -32504,
          message: { uz: 'Avtorizatsiya xatosi', ru: 'Ошибка авторизации', en: 'Authorization error' },
        },
      });
      return;
    }

    if (method === 'CheckPerformTransaction') {
      const companyId = params?.account?.company_id;
      const company = await prisma.company.findUnique({ where: { id: companyId } });

      if (!company) {
        res.json({
          id,
          error: {
            code: -31050,
            message: { uz: 'Kompaniya topilmadi', ru: 'Компания не найдена', en: 'Company not found' },
          },
        });
        return;
      }

      res.json({ id, result: { allow: true } });
      return;
    }

    if (method === 'CreateTransaction') {
      const companyId = params?.account?.company_id;
      const transactionId = params?.id;

      res.json({
        id,
        result: {
          create_time: Date.now(),
          transaction: transactionId,
          state: 1,
        },
      });
      return;
    }

    if (method === 'PerformTransaction') {
      const transactionId = params?.id;
      const companyId = params?.account?.company_id;

      await prisma.payment.updateMany({
        where: { companyId, status: 'PENDING', method: 'PAYME' },
        data: {
          status: 'PAID',
          transactionId,
          paidAt: new Date(),
          gatewayData: req.body,
        },
      });

      res.json({
        id,
        result: {
          transaction: transactionId,
          perform_time: Date.now(),
          state: 2,
        },
      });
      return;
    }

    if (method === 'CancelTransaction') {
      const transactionId = params?.id;
      const companyId = params?.account?.company_id;

      await prisma.payment.updateMany({
        where: { companyId, transactionId, method: 'PAYME' },
        data: { status: 'CANCELLED', gatewayData: req.body },
      });

      res.json({
        id,
        result: {
          transaction: transactionId,
          cancel_time: Date.now(),
          state: -1,
        },
      });
      return;
    }

    if (method === 'CheckTransaction') {
      const transactionId = params?.id;

      const payment = await prisma.payment.findFirst({
        where: { transactionId, method: 'PAYME' },
      });

      if (!payment) {
        res.json({
          id,
          error: {
            code: -31003,
            message: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' },
          },
        });
        return;
      }

      const stateMap: Record<string, number> = { PENDING: 1, PAID: 2, CANCELLED: -1, FAILED: -2 };

      res.json({
        id,
        result: {
          create_time: payment.createdAt.getTime(),
          perform_time: payment.paidAt?.getTime() || 0,
          cancel_time: 0,
          transaction: transactionId,
          state: stateMap[payment.status] ?? -2,
          reason: null,
        },
      });
      return;
    }

    res.json({
      id,
      error: { code: -32601, message: { uz: 'Metod topilmadi', ru: 'Метод не найден', en: 'Method not found' } },
    });
  } catch (error) {
    console.error('paymeWebhook error:', error);
    res.status(500).json({
      id: req.body?.id,
      error: { code: -32400, message: { uz: 'Server xatoligi', ru: 'Ошибка сервера', en: 'Server error' } },
    });
  }
};
