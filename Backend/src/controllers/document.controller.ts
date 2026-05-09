import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuditAction } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';
import { processDocument, addWatermark } from '../services/document.service';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'Fayl yuklanmadi' });
    return;
  }
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    const defaultDays = settings?.defaultRetentionDays || 30;
    const minDays = settings?.minRetentionDays || 7;
    const maxDays = settings?.maxRetentionDays || 90;

    let retentionDays = parseInt(req.body.retentionDays) || defaultDays;
    retentionDays = Math.max(minDays, Math.min(maxDays, retentionDays));

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const document = await prisma.document.create({
      data: {
        originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        retentionDays,
        expiresAt,
        uploadedById: req.user!.id,
      },
    });

    // Audit log va processing — javob yuborishni kechiktirmaslik uchun await qilinmaydi
    prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.UPLOAD,
        documentId: document.id,
        ip: req.ip,
        details: `Hujjat yuklandi: ${req.file.originalname}`,
      },
    }).catch(console.error);

    processDocument(req.file.path, document.id).catch(console.error);

    res.status(201).json({
      message: 'Hujjat qabul qilindi, ishlanmoqda...',
      documentId: document.id,
      retentionDays,
      expiresAt,
    });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const baseWhere = req.user!.role === 'XODIM' ? { uploadedById: req.user!.id } : {};
    const where = { ...baseWhere, status: { not: 'EXPIRED' as const } };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: { select: { name: true, email: true } },
          _count: { select: { pages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    res.json({ documents, total, page, limit });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    });
    if (!document) {
      res.status(404).json({ message: 'Hujjat topilmadi' });
      return;
    }
    if (document.status === 'EXPIRED') {
      res.status(410).json({ message: 'Hujjatning muddati o\'tgan' });
      return;
    }
    if (req.user!.role === 'XODIM' && document.uploadedById !== req.user!.id) {
      res.status(403).json({ message: 'Ruxsat yo\'q' });
      return;
    }
    res.json(document);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) {
      res.status(404).json({ message: 'Hujjat topilmadi' });
      return;
    }
    if (document.status === 'EXPIRED') {
      res.status(410).json({ message: 'Hujjatning muddati o\'tgan' });
      return;
    }
    if (!document.processedPath) {
      res.status(404).json({ message: 'Hujjat tayyor emas' });
      return;
    }
    if (req.user!.role === 'XODIM' && document.uploadedById !== req.user!.id) {
      res.status(403).json({ message: 'Ruxsat yo\'q' });
      return;
    }

    const watermarked = await addWatermark(
      document.processedPath,
      req.user!.name,
      new Date()
    );

    await prisma.document.update({
      where: { id: document.id },
      data: { isDownloaded: true, downloadedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.DOWNLOAD,
        documentId: document.id,
        ip: req.ip,
        details: `Hujjat yuklab olindi: ${document.originalName}`,
      },
    });

    const pdfName = document.originalName.replace(/\.(doc|docx|pdf)$/i, '') + '.pdf';
    const safeName = encodeURIComponent(pdfName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfName.replace(/[^\x00-\x7F]/g, '_')}"; filename*=UTF-8''${safeName}`);
    res.send(watermarked);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) {
      res.status(404).json({ message: 'Hujjat topilmadi' });
      return;
    }

    const uploadPath = path.join(UPLOADS_DIR, document.storedName);
    if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

    if (document.processedPath) {
      const processedPath = path.join(path.join(__dirname, '..', '..', 'processed'), document.processedPath);
      if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: AuditAction.DELETE,
        documentId: document.id,
        ip: req.ip,
        details: `Hujjat o'chirildi: ${document.originalName}`,
      },
    });

    await prisma.auditLog.updateMany({
      where: { documentId: document.id },
      data: { documentId: null },
    });

    await prisma.document.delete({ where: { id: document.id } });

    res.json({ message: 'Hujjat o\'chirildi' });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const previewDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) {
      res.status(404).json({ message: 'Hujjat topilmadi' });
      return;
    }
    if (document.status === 'EXPIRED') {
      res.status(410).json({ message: 'Hujjatning muddati o\'tgan' });
      return;
    }
    if (!document.processedPath) {
      res.status(404).json({ message: 'Hujjat tayyor emas' });
      return;
    }
    if (req.user!.role === 'XODIM' && document.uploadedById !== req.user!.id) {
      res.status(403).json({ message: 'Ruxsat yo\'q' });
      return;
    }
    const filePath = path.join(path.join(__dirname, '..', '..', 'processed'), document.processedPath);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Fayl topilmadi' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalDocs, byStatus, recentUploads, totalUsers] = await Promise.all([
      prisma.document.count(),
      prisma.document.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.document.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    res.json({ totalDocs, byStatus, recentUploads, totalUsers });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
