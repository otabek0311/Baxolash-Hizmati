import { Response } from 'express';
import { AuditAction } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

export const getSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    res.json(settings);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { defaultRetentionDays, minRetentionDays, maxRetentionDays, maxFileSizeMb } = req.body;

  if (
    typeof minRetentionDays !== 'number' || typeof maxRetentionDays !== 'number' ||
    typeof defaultRetentionDays !== 'number' || typeof maxFileSizeMb !== 'number' ||
    !Number.isInteger(minRetentionDays) || !Number.isInteger(maxRetentionDays) ||
    !Number.isInteger(defaultRetentionDays) || !Number.isInteger(maxFileSizeMb)
  ) {
    res.status(400).json({ message: 'Barcha qiymatlar butun son bo\'lishi kerak' });
    return;
  }

  if (minRetentionDays < 7 || maxRetentionDays > 90) {
    res.status(400).json({ message: 'Muddat 7 dan 90 kungacha bo\'lishi kerak' });
    return;
  }

  if (defaultRetentionDays < minRetentionDays || defaultRetentionDays > maxRetentionDays) {
    res.status(400).json({ message: 'Standart muddat min va max orasida bo\'lishi kerak' });
    return;
  }

  try {
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: { defaultRetentionDays, minRetentionDays, maxRetentionDays, maxFileSizeMb, updatedById: req.user!.id },
      create: { id: 'singleton', defaultRetentionDays, minRetentionDays, maxRetentionDays, maxFileSizeMb, updatedById: req.user!.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.SETTINGS_UPDATE,
        ip: req.ip,
        details: `Sozlamalar yangilandi: saqlash muddati ${defaultRetentionDays} kun`,
      },
    });

    res.json(settings);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
