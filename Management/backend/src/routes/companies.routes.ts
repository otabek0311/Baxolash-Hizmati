import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  suspendCompany,
  activateCompany,
  deleteCompany,
} from '../controllers/companies.controller';

const router = Router();

router.use(authenticate);

router.get('/',              getCompanies);
router.get('/:id',           getCompany);
router.post('/',             createCompany);
router.put('/:id',           updateCompany);
router.post('/:id/suspend',  suspendCompany);
router.post('/:id/activate', activateCompany);
router.delete('/:id',        deleteCompany);

export default router;
