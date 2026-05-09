import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role, AuditAction } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where = req.user?.role === 'ADMIN'
      ? { isActive: true, role: { not: Role.SUPERADMIN } }
      : { isActive: true };
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true, lastSeenAt: true,
        createdBy: { select: { name: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ message: 'Barcha maydonlar to\'ldirilishi shart' });
    return;
  }

  const allowedRoles: Record<Role, Role[]> = {
    SUPERADMIN: [Role.ADMIN, Role.XODIM],
    ADMIN: [Role.XODIM],
    XODIM: [],
  };

  if (!req.user || !allowedRoles[req.user.role].includes(role)) {
    res.status(403).json({ message: 'Bu rolni yaratish huquqingiz yo\'q' });
    return;
  }

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      res.status(409).json({ message: 'Bu email allaqachon mavjud' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, createdById: req.user!.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.USER_CREATE,
        ip: req.ip,
        details: `Yangi foydalanuvchi yaratildi: ${name} (${role})`,
      },
    });

    res.status(201).json(user);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, isActive, role } = req.body;

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true } });
    if (!target) { res.status(404).json({ message: 'Foydalanuvchi topilmadi' }); return; }

    const actorRole = req.user!.role;
    if (actorRole === 'ADMIN' && target.role !== 'XODIM' && target.id !== req.user!.id) {
      res.status(403).json({ message: 'Siz faqat xodimlarni tahrirlashingiz mumkin' });
      return;
    }
    if (actorRole === 'SUPERADMIN' && target.role === 'SUPERADMIN' && target.id !== req.user!.id) {
      res.status(403).json({ message: 'Boshqa Super Adminni tahrirlash mumkin emas' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && actorRole === 'SUPERADMIN') updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.USER_UPDATE,
        ip: req.ip,
        details: `Foydalanuvchi yangilandi: ${user.name}`,
      },
    });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (id === req.user!.id) {
    res.status(400).json({ message: 'O\'zingizni o\'chira olmaysiz' });
    return;
  }
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, name: true } });
    if (!target) { res.status(404).json({ message: 'Foydalanuvchi topilmadi' }); return; }
    if (req.user!.role === 'ADMIN' && target.role !== 'XODIM') {
      res.status(403).json({ message: 'Siz faqat xodimlarni o\'chira olasiz' });
      return;
    }
    if (target.role === 'SUPERADMIN') {
      res.status(403).json({ message: 'Super Adminni o\'chirish mumkin emas' });
      return;
    }
    await prisma.user.update({ where: { id }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.USER_DELETE,
        ip: req.ip,
        details: `Foydalanuvchi o'chirildi: ${id}`,
      },
    });

    res.json({ message: 'Foydalanuvchi o\'chirildi' });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    return;
  }
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) { res.status(404).json({ message: 'Foydalanuvchi topilmadi' }); return; }
    if (req.user!.role === 'ADMIN' && target.role !== 'XODIM') {
      res.status(403).json({ message: 'Siz faqat xodimlar parolini tiklashingiz mumkin' });
      return;
    }
    if (target.role === 'SUPERADMIN' && req.user!.role !== 'SUPERADMIN') {
      res.status(403).json({ message: 'Super Admin parolini faqat Super Admin tiklay oladi' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.USER_UPDATE,
        ip: req.ip,
        details: `Parol tiklandi: ${id}`,
      },
    });
    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
