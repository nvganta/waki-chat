import { Router } from 'express';
import { journalController } from '../controllers/journal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All journal routes require authentication
router.use(authMiddleware);

router.post('/entries', journalController.createEntry);
router.get('/entries', journalController.getEntries);
router.get('/search', journalController.searchEntries);
router.delete('/entries/:id', journalController.deleteEntry);
router.get('/mood-stats', journalController.getMoodStats);
router.post('/analyze-mood', journalController.analyzeMood);

export default router;