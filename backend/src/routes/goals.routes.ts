import { Router } from 'express';
import { goalsController } from '../controllers/goals.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All goals routes require authentication
router.use(authMiddleware);

router.post('/', goalsController.createGoal);
router.get('/', goalsController.getGoals);
router.put('/:goalId/progress', goalsController.updateProgress);
router.post('/:goalId/link-journal', goalsController.linkJournalEntry);
router.post('/suggestions', goalsController.getSuggestions);
router.delete('/:goalId', goalsController.deleteGoal);
router.get('/progress', goalsController.getProgress);

export default router;