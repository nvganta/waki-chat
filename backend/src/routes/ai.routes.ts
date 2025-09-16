import { Router } from 'express';
import { aiController, uploadMiddleware } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/wake-message', aiController.generateWakeUpMessage.bind(aiController));
router.post('/generate-audio', aiController.generateAudio.bind(aiController));
router.post(
  '/voice-command',
  uploadMiddleware.single('audio'),
  aiController.processVoiceCommand.bind(aiController)
);
router.get('/test-alarm', aiController.testAlarm.bind(aiController));

export default router;