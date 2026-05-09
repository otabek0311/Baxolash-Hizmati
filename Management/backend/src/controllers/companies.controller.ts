import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import {
  provisionCompany,
  stopCompany,
  startCompany,
  removeCompany,
} from '../services/provisioning.service';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generatePassword(length = 16): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function getNextPort(field: 'frontendPort' | 'backendPort' | 'dbPort'): Promise<number> {
  const baseMap = { frontendPort: 3100, backendPort: 5100, dbPort: 5534 };
  const base = baseMap[field];

  const companies = await prisma.company.findMany({
    select: { [field]: true },
    orderBy: { [field]: 'desc' },
    take: 1,
  });

  if (companies.length === 0) return base;
  const last = companies[0][field] as unknown as number;
  return last >= base ? last + 1 : base;
}

function daysRemaining(periodEnd: Date): number {
  const now = new Date();
  const diff = periodEnd.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// GET /api/companies
export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        payments: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = companies.map((company) => {
      const latestPayment = company.payments[0] || null;
      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        domain: company.domain,
        status: company.status,
        contactName: company.contactName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        monthlyPrice: company.monthlyPrice,
        currency: company.currency,
        frontendPort: company.frontendPort,
        backendPort: company.backendPort,
        dbPort: company.dbPort,
        provisionedAt: company.provisionedAt,
        createdAt: company.createdAt,
        latestPayment: latestPayment
          ? {
              id: latestPayment.id,
              amount: latestPayment.amount,
              status: latestPayment.status,
              periodEnd: latestPayment.periodEnd,
              daysRemaining: daysRemaining(latestPayment.periodEnd),
            }
          : null,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('getCompanies error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// GET /api/companies/:id
export const getCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        metrics: {
          where: { recordedAt: { gte: since } },
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const latestPayment = company.payments[0] || null;

    res.json({
      ...company,
      dbPassword: undefined,
      latestPayment: latestPayment
        ? { ...latestPayment, daysRemaining: daysRemaining(latestPayment.periodEnd) }
        : null,
    });
  } catch (error) {
    console.error('getCompany error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/companies
export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug: rawSlug, monthlyPrice, domain, contactName, contactEmail, contactPhone, notes } = req.body;

    if (!name) {
      res.status(400).json({ message: 'name majburiy' });
      return;
    }
    if (monthlyPrice === undefined || monthlyPrice === null) {
      res.status(400).json({ message: 'monthlyPrice majburiy' });
      return;
    }

    const slug = rawSlug ? slugify(rawSlug) : slugify(name);

    // Check slug uniqueness
    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ message: `"${slug}" slug allaqachon mavjud` });
      return;
    }

    // Auto-assign ports
    const [frontendPort, backendPort, dbPort] = await Promise.all([
      getNextPort('frontendPort'),
      getNextPort('backendPort'),
      getNextPort('dbPort'),
    ]);

    const dbName = `qr_${slug.replace(/-/g, '_')}`;
    const dbUser = `user_${slug.replace(/-/g, '_')}`;
    const dbPassword = generatePassword(16);

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        domain: domain || null,
        frontendPort,
        backendPort,
        dbPort,
        dbName,
        dbUser,
        dbPassword,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        notes: notes || null,
        monthlyPrice: parseFloat(monthlyPrice),
        status: 'PROVISIONING',
      },
    });

    // Provision asynchronously (don't block response)
    provisionCompany(company)
      .then(async () => {
        await prisma.company.update({
          where: { id: company.id },
          data: {
            status: 'ACTIVE',
            provisionedAt: new Date(),
            serverPath: `/opt/qrhujjat/companies/${slug}`,
          },
        });
        console.log(`[Companies] ${slug} muvaffaqiyatli provisionlandi`);
      })
      .catch(async (err) => {
        console.error(`[Companies] Provisioning xatosi (${slug}):`, err);
        await prisma.company.update({
          where: { id: company.id },
          data: { status: 'SUSPENDED' },
        });
      });

    res.status(201).json({
      ...company,
      dbPassword: undefined,
      message: 'Kompaniya yaratildi, provisioning boshlandi',
    });
  } catch (error) {
    console.error('createCompany error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// PUT /api/companies/:id
export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contactName, contactEmail, contactPhone, notes, monthlyPrice, domain } = req.body;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(notes !== undefined && { notes }),
        ...(monthlyPrice !== undefined && { monthlyPrice: parseFloat(monthlyPrice) }),
        ...(domain !== undefined && { domain }),
      },
    });

    res.json({ ...updated, dbPassword: undefined });
  } catch (error) {
    console.error('updateCompany error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/companies/:id/suspend
export const suspendCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }
    if (company.status === 'SUSPENDED') {
      res.status(400).json({ message: 'Kompaniya allaqachon to\'xtatilgan' });
      return;
    }

    await prisma.company.update({ where: { id }, data: { status: 'SUSPENDED' } });

    try {
      await stopCompany(company.slug);
    } catch (dockerError) {
      console.warn(`[Companies] Docker stop xatosi (${company.slug}):`, dockerError);
    }

    res.json({ message: 'Kompaniya to\'xtatildi', id });
  } catch (error) {
    console.error('suspendCompany error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// POST /api/companies/:id/activate
export const activateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }
    if (company.status === 'ACTIVE') {
      res.status(400).json({ message: 'Kompaniya allaqachon faol' });
      return;
    }

    await prisma.company.update({ where: { id }, data: { status: 'ACTIVE' } });

    try {
      await startCompany(company.slug);
    } catch (dockerError) {
      console.warn(`[Companies] Docker start xatosi (${company.slug}):`, dockerError);
    }

    res.json({ message: 'Kompaniya faollashtirildi', id });
  } catch (error) {
    console.error('activateCompany error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// DELETE /api/companies/:id
export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    // Mark as terminated first
    await prisma.company.update({ where: { id }, data: { status: 'TERMINATED' } });

    // Remove Docker infrastructure
    try {
      await removeCompany(company.slug);
    } catch (dockerError) {
      console.warn(`[Companies] Docker remove xatosi (${company.slug}):`, dockerError);
    }

    // Delete from DB (cascade deletes payments and metrics)
    await prisma.payment.deleteMany({ where: { companyId: id } });
    await prisma.serverMetric.deleteMany({ where: { companyId: id } });
    await prisma.company.delete({ where: { id } });

    res.json({ message: 'Kompaniya o\'chirildi', id });
  } catch (error) {
    console.error('deleteCompany error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};
