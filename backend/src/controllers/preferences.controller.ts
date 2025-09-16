import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { alarmService } from '../services/alarm.service';

export class PreferencesController {
  async getPreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const preferences = await alarmService.getUserPreferences(userId);
      
      if (!preferences) {
        // Return default preferences if none exist
        return res.json({
          userId,
          name: 'User',
          location: { city: 'New York', country: 'US' },
          voiceStyle: 'friendly',
          includeWeather: true,
          includeNews: false,
          newsTopics: [],
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const updates = req.body;

      const preferences = await alarmService.updateUserPreferences(userId, updates);
      res.json(preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
}

export const preferencesController = new PreferencesController();