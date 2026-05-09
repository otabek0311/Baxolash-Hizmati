import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  const q = ((req.query.q as string) || '').trim();

  if (q.length < 1) {
    res.json({ documents: [], users: [] });
    return;
  }

  try {
    const docWhere: any = { originalName: { contains: q, mode: 'insensitive' } };
    if (req.user!.role === 'XODIM') docWhere.uploadedById = req.user!.id;

    const [documents, users] = await Promise.all([
      prisma.document.findMany({
        where: docWhere,
        select: {
          id: true,
          originalName: true,
          status: true,
          pageCount: true,
          createdAt: true,
          uploadedBy: { select: { name: true } },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      req.user!.role !== 'XODIM'
        ? prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
              role: { not: 'SUPERADMIN' },
            },
            select: { id: true, name: true, email: true, role: true },
            take: 4,
          })
        : Promise.resolve([]),
    ]);

    res.json({ documents, users });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
