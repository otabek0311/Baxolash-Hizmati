import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getUsers, createUser, updateUser, deleteUser, resetPassword } from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.use(authenticate);

userRoutes.get('/', authorize('SUPERADMIN', 'ADMIN'), getUsers);
userRoutes.post('/', authorize('SUPERADMIN', 'ADMIN'), createUser);
userRoutes.put('/:id', authorize('SUPERADMIN', 'ADMIN'), updateUser);
userRoutes.delete('/:id', authorize('SUPERADMIN', 'ADMIN'), deleteUser);
userRoutes.post('/:id/reset-password', authorize('SUPERADMIN', 'ADMIN'), resetPassword);
