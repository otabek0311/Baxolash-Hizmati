import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: Role; name: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token topilmadi' });
    return;
  }

  let decoded: NonNullable<AuthRequest['user']>;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as NonNullable<AuthRequest['user']>;
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
    return;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });
    if (!dbUser || !dbUser.isActive) {
      res.status(401).json({ message: 'Foydalanuvchi faol emas' });
      return;
    }
    req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.name };
    prisma.user.update({ where: { id: dbUser.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    next();
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Ruxsat yo\'q' });
      return;
    }
    next();
  };
};
