import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuditAction } from '@prisma/client';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email va parol kiritilishi shart' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Email formati noto\'g\'ri' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ message: 'Akkaunt bloklangan. Administrator bilan bog\'laning' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.FAILED_LOGIN,
          ip: req.ip,
          details: `Noto'g'ri parol: ${user.email}`,
        },
      }).catch(() => {});
      res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.LOGIN,
        ip: req.ip,
        details: `${user.name} tizimga kirdi`,
      },
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const logout = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: AuditAction.LOGOUT,
          ip: req.ip,
          details: `${req.user.name} tizimdan chiqdi`,
        },
      });
    }
    res.json({ message: 'Muvaffaqiyatli chiqildi' });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const getMe = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { lastSeenAt: new Date() },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
