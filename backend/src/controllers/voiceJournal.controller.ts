import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { voiceJournalService, audioUpload } from '../services/voiceJournal.service';

export class VoiceJournalController {
  async processVoiceJournal(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const keepAudio = req.body.keepAudio !== 'false';
      
      const result = await voiceJournalService.processVoiceJournal(
        req.user.uid,
        req.file.path,
        keepAudio
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error processing voice journal:', error);
      res.status(500).json({ error: 'Failed to process voice journal' });
    }
  }

  async getDailySummary(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const summary = await voiceJournalService.generateDailySummary(req.user.uid);

      res.json({ summary });
    } catch (error) {
      console.error('Error generating daily summary:', error);
      res.status(500).json({ error: 'Failed to generate daily summary' });
    }
  }

  async getAudioInsights(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const days = parseInt(req.query.days as string) || 7;
      const insights = await voiceJournalService.getAudioInsights(req.user.uid, days);

      res.json(insights);
    } catch (error) {
      console.error('Error getting audio insights:', error);
      res.status(500).json({ error: 'Failed to get audio insights' });
    }
  }
}

export const voiceJournalController = new VoiceJournalController();