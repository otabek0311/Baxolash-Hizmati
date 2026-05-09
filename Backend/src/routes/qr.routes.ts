import { Router } from 'express';
import { scanQR, viewQR } from '../controllers/qr.controller';

export const qrRoutes = Router();

// Telefon kamerasi uchun — PDF qaytaradi (login kerak emas)
qrRoutes.get('/:token/view', viewQR);

// Ilova ichidagi scanner uchun — JSON qaytaradi (login kerak emas)
qrRoutes.get('/:token', scanQR);
