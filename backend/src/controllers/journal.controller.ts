import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { journalService } from '../services/journal.service';

export class JournalController {
  async createEntry(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content, mood, tags, audioUrl } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Journal content is required' });
      }

      const entryId = await journalService.createEntry({
        userId: req.user.uid,
        content,
        mood,
        tags,
        audioUrl,
        createdAt: new Date(),
      });

      res.status(201).json({
        message: 'Journal entry created successfully',
        id: entryId,
      });
    } catch (error) {
      console.error('Error creating journal entry:', error);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }

  async getEntries(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const entries = await journalService.getEntries(req.user.uid, limit);

      res.json(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
  }

  async searchEntries(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { query } = req.query;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const entries = await journalService.searchEntries(
        req.user.uid,
        query as string,
        limit
      );

      res.json(entries);
    } catch (error) {
      console.error('Error searching journal entries:', error);
      res.status(500).json({ error: 'Failed to search journal entries' });
    }
  }

  async deleteEntry(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Entry ID is required' });
      }

      await journalService.deleteEntry(req.user.uid, id);

      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting journal entry:', error);
      
      if (error.message === 'Unauthorized to delete this entry') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to delete journal entry' });
    }
  }

  async getMoodStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const stats = await journalService.getMoodStats(req.user.uid, days);

      res.json(stats);
    } catch (error) {
      console.error('Error fetching mood stats:', error);
      res.status(500).json({ error: 'Failed to fetch mood statistics' });
    }
  }

  async analyzeMood(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required for mood analysis' });
      }

      const analysis = await journalService.analyzeMood(content);

      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing mood:', error);
      res.status(500).json({ error: 'Failed to analyze mood' });
    }
  }
}

export const journalController = new JournalController();