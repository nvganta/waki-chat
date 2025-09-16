import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/export', analyticsController.exportAnalytics);

export default router;