import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const PROCESSED_DIR = path.join(__dirname, '..', '..', 'processed');

const deleteDocumentFiles = (doc: { id: string; storedName: string; processedPath: string | null }) => {
  const uploadPath = path.join(UPLOADS_DIR, doc.storedName);
  if (fs.existsSync(uploadPath)) {
    try { fs.unlinkSync(uploadPath); } catch (e) { console.error(`[Cleanup] Upload o'chirishda xato ${doc.id}:`, e); }
  }
  if (doc.processedPath) {
    const processedPath = path.join(PROCESSED_DIR, doc.processedPath);
    if (fs.existsSync(processedPath)) {
      try { fs.unlinkSync(processedPath); } catch (e) { console.error(`[Cleanup] Processed o'chirishda xato ${doc.id}:`, e); }
    }
  }
};

const deleteExpiredDocuments = async () => {
  try {
    const expired = await prisma.document.findMany({
      where: { expiresAt: { lte: new Date() }, status: { not: 'EXPIRED' } },
    });

    const oldExpired = await prisma.document.findMany({
      where: { status: 'EXPIRED' },
    });

    const allToDelete = [...expired, ...oldExpired];

    for (const doc of allToDelete) {
      try {
        deleteDocumentFiles(doc);
        await prisma.auditLog.updateMany({ where: { documentId: doc.id }, data: { documentId: null } });
        await prisma.document.delete({ where: { id: doc.id } });
      } catch (e) {
        console.error(`[Cleanup] Hujjat ${doc.id} o'chirishda xato:`, e);
      }
    }

    if (allToDelete.length > 0) {
      console.log(`[Cleanup] ${allToDelete.length} ta hujjat DB dan o'chirildi`);
    }
  } catch (err) {
    console.error('[Cleanup] Xato:', err);
  }
};

export const startCleanupJob = () => {
  cron.schedule('0 2 * * *', deleteExpiredDocuments);
  console.log('Avtomatik tozalash xizmati ishga tushdi');
};
