import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '../utils/prisma';
import { AuditAction } from '@prisma/client';

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'processed');

// Ochiq endpoint: telefon QR skaneri uchun — PDF qaytaradi
export const viewQR = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  try {
    const page = await prisma.page.findUnique({
      where: { qrToken: token },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
            processedPath: true,
            expiresAt: true,
            uploadedBy: { select: { name: true } },
          },
        },
      },
    });

    if (!page) {
      res.status(404).send('QR kod topilmadi yoki yaroqsiz');
      return;
    }

    if (page.document.status === 'EXPIRED') {
      res.status(410).send('Bu hujjatning muddati o\'tgan');
      return;
    }

    if (!page.document.processedPath) {
      res.status(503).send('Hujjat hali tayyorlanmagan');
      return;
    }

    const pdfPath = path.join(PROCESSED_DIR, page.document.processedPath);
    if (!fs.existsSync(pdfPath)) {
      res.status(404).send('Fayl topilmadi');
      return;
    }

    await prisma.qRScan.create({
      data: {
        pageId: page.id,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AuditAction.QR_SCAN,
        documentId: page.document.id,
        ip: req.ip,
        details: `${page.pageNumber}-bet skanerlandi: ${page.document.originalName}`,
      },
    });

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfName = page.document.originalName.replace(/\.(doc|docx|pdf)$/i, '') + '.pdf';
    const safeName = encodeURIComponent(pdfName);

    if (page.pageNumber === 1) {
      // 1-bet: to'liq hujjatni qaytaradi
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfName.replace(/[^\x00-\x7F]/g, '_')}"; filename*=UTF-8''${safeName}`);
      res.send(pdfBytes);
    } else {
      // 2+ bet: faqat o'sha sahifani ajratib qaytaradi
      const srcDoc = await PDFDocument.load(pdfBytes);
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [page.pageNumber - 1]);
      singleDoc.addPage(copiedPage);
      const singleBytes = await singleDoc.save();

      const pageName = `${pdfName.replace('.pdf', '')}_bet${page.pageNumber}.pdf`;
      const safePage = encodeURIComponent(pageName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pageName.replace(/[^\x00-\x7F]/g, '_')}"; filename*=UTF-8''${safePage}`);
      res.send(Buffer.from(singleBytes));
    }
  } catch {
    res.status(500).send('Server xatosi');
  }
};

// Ilova ichidagi scanner uchun — JSON qaytaradi
export const scanQR = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  try {
    const page = await prisma.page.findUnique({
      where: { qrToken: token },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            status: true,
            processedPath: true,
            expiresAt: true,
            uploadedBy: { select: { name: true } },
          },
        },
      },
    });

    if (!page) {
      res.status(404).json({ message: 'QR kod topilmadi yoki yaroqsiz' });
      return;
    }

    if (page.document.status === 'EXPIRED') {
      res.status(410).json({ message: 'Bu hujjatning muddati o\'tgan' });
      return;
    }

    await prisma.qRScan.create({
      data: {
        pageId: page.id,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AuditAction.QR_SCAN,
        documentId: page.document.id,
        ip: req.ip,
        details: `${page.pageNumber}-bet skanerlandi: ${page.document.originalName}`,
      },
    });

    if (page.pageNumber === 1) {
      const allPages = await prisma.page.findMany({
        where: { documentId: page.documentId },
        orderBy: { pageNumber: 'asc' },
        select: { pageNumber: true },
      });

      res.json({
        valid: true,
        type: 'document',
        document: {
          id: page.document.id,
          name: page.document.originalName,
          totalPages: allPages.length,
          uploadedBy: page.document.uploadedBy.name,
          expiresAt: page.document.expiresAt,
          pages: allPages.map(p => ({ pageNumber: p.pageNumber })),
        },
        downloadUrl: page.document.processedPath ? `/api/documents/${page.document.id}/download` : undefined,
      });
    } else {
      res.json({
        valid: true,
        type: 'page',
        document: {
          name: page.document.originalName,
          page: page.pageNumber,
          uploadedBy: page.document.uploadedBy.name,
          expiresAt: page.document.expiresAt,
        },
      });
    }
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
