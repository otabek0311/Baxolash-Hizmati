import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const rawPage = parseInt(req.query.page as string) || 1;
  const rawLimit = parseInt(req.query.limit as string) || 50;
  const { action, userId } = req.query;

  const page = Math.max(1, rawPage);
  const limit = Math.min(100, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } },
          document: { select: { originalName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page, limit });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
