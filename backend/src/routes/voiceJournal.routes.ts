import { Router } from 'express';
import { voiceJournalController } from '../controllers/voiceJournal.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { audioUpload } from '../services/voiceJournal.service';

const router = Router();

// All voice journal routes require authentication
router.use(authMiddleware);

// Upload and process voice journal
router.post(
  '/process',
  audioUpload.single('audio'),
  voiceJournalController.processVoiceJournal
);

// Get daily summary
router.get('/daily-summary', voiceJournalController.getDailySummary);

// Get audio insights
router.get('/insights', voiceJournalController.getAudioInsights);

export default router;