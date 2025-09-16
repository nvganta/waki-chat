import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { goalsService } from '../services/goals.service';

export class GoalsController {
  async createGoal(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, description, category, targetDate, milestones, reminderTime } = req.body;

      if (!title || !category || !targetDate) {
        return res.status(400).json({ 
          error: 'Title, category, and target date are required' 
        });
      }

      const goalId = await goalsService.createGoal({
        userId: req.user.uid,
        title,
        description,
        category,
        targetDate: new Date(targetDate),
        milestones: milestones || [],
        reminderTime,
        progress: 0,
        isCompleted: false,
        linkedJournalEntries: [],
      });

      res.status(201).json({
        success: true,
        goalId,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ error: 'Failed to create goal' });
    }
  }

  async getGoals(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const includeCompleted = req.query.includeCompleted === 'true';
      const goals = await goalsService.getGoals(req.user.uid, includeCompleted);

      res.json(goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  }

  async updateProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { goalId } = req.params;
      const { progress, milestoneId } = req.body;

      if (progress === undefined) {
        return res.status(400).json({ error: 'Progress value is required' });
      }

      await goalsService.updateGoalProgress(
        req.user.uid,
        goalId,
        progress,
        milestoneId
      );

      res.json({ success: true, message: 'Goal progress updated' });
    } catch (error: any) {
      console.error('Error updating goal progress:', error);
      
      if (error.message === 'Unauthorized to update this goal') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to update goal progress' });
    }
  }

  async linkJournalEntry(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { goalId } = req.params;
      const { journalEntryId } = req.body;

      if (!journalEntryId) {
        return res.status(400).json({ error: 'Journal entry ID is required' });
      }

      await goalsService.linkJournalEntry(req.user.uid, goalId, journalEntryId);

      res.json({ success: true, message: 'Journal entry linked to goal' });
    } catch (error) {
      console.error('Error linking journal entry:', error);
      res.status(500).json({ error: 'Failed to link journal entry' });
    }
  }

  async getSuggestions(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { recentContent } = req.body;
      
      const suggestions = await goalsService.getGoalSuggestions(
        req.user.uid,
        recentContent || ''
      );

      res.json({ suggestions });
    } catch (error) {
      console.error('Error getting goal suggestions:', error);
      res.status(500).json({ error: 'Failed to get goal suggestions' });
    }
  }

  async deleteGoal(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { goalId } = req.params;

      await goalsService.deleteGoal(req.user.uid, goalId);

      res.json({ success: true, message: 'Goal deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      
      if (error.message === 'Unauthorized to delete this goal') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  }

  async getProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const progress = await goalsService.getGoalProgress(req.user.uid);

      res.json(progress);
    } catch (error) {
      console.error('Error getting goal progress:', error);
      res.status(500).json({ error: 'Failed to get goal progress' });
    }
  }
}

export const goalsController = new GoalsController();