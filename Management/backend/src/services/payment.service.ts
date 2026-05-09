import axios from 'axios';
import { prisma } from '../utils/prisma';
import { stopCompany } from './provisioning.service';

export async function checkPaymentDeadlines(): Promise<void> {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all active/suspended companies with their latest payment
    const companies = await prisma.company.findMany({
      where: { status: { in: ['ACTIVE', 'SUSPENDED'] } },
      include: {
        payments: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
        },
      },
    });

    for (const company of companies) {
      const latestPayment = company.payments[0];
      if (!latestPayment) {
        console.log(`[Payment] ${company.name}: to'lov tarixi yo'q`);
        continue;
      }

      const periodEnd = new Date(latestPayment.periodEnd);
      const daysLeft = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (periodEnd < now) {
        // Payment expired — auto-suspend
        console.warn(`[Payment] ${company.name}: to'lov muddati o'tdi (${periodEnd.toLocaleDateString()}). Avtomatik to'xtatilmoqda...`);

        if (company.status === 'ACTIVE') {
          try {
            await prisma.company.update({
              where: { id: company.id },
              data: { status: 'SUSPENDED' },
            });
            await stopCompany(company.slug);
            console.log(`[Payment] ${company.name} to'xtatildi`);
          } catch (err) {
            console.error(`[Payment] ${company.name} to'xtatishda xato:`, err);
          }
        }
      } else if (daysLeft <= 7) {
        // Warning: payment due within 7 days
        console.warn(`[Payment] OGOHLANTIRISH: ${company.name} uchun to'lov muddati ${daysLeft} kun ichida tugaydi (${periodEnd.toLocaleDateString()}). Email: ${company.contactEmail || 'ko\'rsatilmagan'}`);
        // TODO: Send email notification here
      } else {
        console.log(`[Payment] ${company.name}: ${daysLeft} kun qoldi`);
      }
    }
  } catch (error) {
    console.error('[Payment] checkPaymentDeadlines xatosi:', error);
  }
}

export async function createClickPayment(companyId: string, amount: number): Promise<string> {
  const merchantId = process.env.CLICK_MERCHANT_ID;
  const serviceId = process.env.CLICK_SERVICE_ID;

  if (!merchantId || !serviceId) {
    throw new Error('CLICK_MERCHANT_ID va CLICK_SERVICE_ID muhit o\'zgaruvchilari kerak');
  }

  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: amount.toString(),
    transaction_param: companyId,
    return_url: `${process.env.CORS_ORIGIN || 'http://localhost:7100'}/payments/success`,
  });

  const paymentUrl = `https://my.click.uz/services/pay?${params.toString()}`;
  return paymentUrl;
}

export async function createPaymePayment(companyId: string, amount: number): Promise<string> {
  const merchantId = process.env.PAYME_MERCHANT_ID;

  if (!merchantId) {
    throw new Error('PAYME_MERCHANT_ID muhit o\'zgaruvchisi kerak');
  }

  // Payme expects amount in tiyin (1 UZS = 100 tiyin)
  const amountTiyin = Math.round(amount * 100);

  const params = {
    m: merchantId,
    ac: { company_id: companyId },
    a: amountTiyin,
    l: 'uz',
    cr: 'UZS',
  };

  const encoded = Buffer.from(JSON.stringify(params)).toString('base64');
  const paymentUrl = `https://checkout.paycom.uz/${encoded}`;
  return paymentUrl;
}
