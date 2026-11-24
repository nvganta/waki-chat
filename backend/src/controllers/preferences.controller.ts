import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { alarmService } from '../services/alarm.service';
import { isWakeUpStyle } from '../services/wake-style';

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
          wakeUpStyle: 'moderate',
          includeWeather: true,
          includeNews: false,
          newsTopics: [],
        });
      }

      return res.json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const updates = req.body;
      if (updates?.wakeUpStyle !== undefined && !isWakeUpStyle(updates.wakeUpStyle)) {
        return res.status(400).json({ error: 'wakeUpStyle must be gentle, moderate, or assertive' });
      }

      const preferences = await alarmService.updateUserPreferences(userId, updates);
      return res.json(preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
}

export const preferencesController = new PreferencesController();
