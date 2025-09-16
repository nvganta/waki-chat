import { Router } from 'express';
import { preferencesController } from '../controllers/preferences.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', preferencesController.getPreferences.bind(preferencesController));
router.put('/', preferencesController.updatePreferences.bind(preferencesController));

export default router;