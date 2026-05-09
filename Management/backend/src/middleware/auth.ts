import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ message: 'Token kerak' }); return; }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
};
