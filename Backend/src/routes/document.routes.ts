import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  uploadDocument, getDocuments, getDocument,
  downloadDocument, deleteDocument, getStats, previewDocument,
} from '../controllers/document.controller';

export const documentRoutes = Router();

documentRoutes.use(authenticate);

documentRoutes.get('/stats', authorize('SUPERADMIN', 'ADMIN'), getStats);
documentRoutes.get('/', getDocuments);
documentRoutes.get('/:id', getDocument);
documentRoutes.post('/upload', authorize('SUPERADMIN', 'ADMIN', 'XODIM'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }
      next();
    });
  },
  uploadDocument
);
documentRoutes.get('/:id/preview', previewDocument);
documentRoutes.get('/:id/download', downloadDocument);
documentRoutes.delete('/:id', authorize('SUPERADMIN', 'ADMIN'), deleteDocument);
