import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { alarmService } from '../services/alarm.service';

export class AlarmController {
  async createAlarm(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const alarmData = req.body;

      const alarm = await alarmService.createAlarm(userId, alarmData);
      res.status(201).json(alarm);
    } catch (error) {
      console.error('Error creating alarm:', error);
      res.status(500).json({ error: 'Failed to create alarm' });
    }
  }

  async getAlarms(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const alarms = await alarmService.getAlarmsByUser(userId);
      res.json(alarms);
    } catch (error) {
      console.error('Error fetching alarms:', error);
      res.status(500).json({ error: 'Failed to fetch alarms' });
    }
  }

  async getAlarm(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const alarm = await alarmService.getAlarm(id);
      
      if (!alarm) {
        return res.status(404).json({ error: 'Alarm not found' });
      }

      // Verify ownership
      if (alarm.userId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(alarm);
    } catch (error) {
      console.error('Error fetching alarm:', error);
      res.status(500).json({ error: 'Failed to fetch alarm' });
    }
  }

  async updateAlarm(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verify ownership first
      const existingAlarm = await alarmService.getAlarm(id);
      if (!existingAlarm) {
        return res.status(404).json({ error: 'Alarm not found' });
      }
      if (existingAlarm.userId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const alarm = await alarmService.updateAlarm(id, updates);
      res.json(alarm);
    } catch (error) {
      console.error('Error updating alarm:', error);
      res.status(500).json({ error: 'Failed to update alarm' });
    }
  }

  async deleteAlarm(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verify ownership first
      const existingAlarm = await alarmService.getAlarm(id);
      if (!existingAlarm) {
        return res.status(404).json({ error: 'Alarm not found' });
      }
      if (existingAlarm.userId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const success = await alarmService.deleteAlarm(id);
      if (!success) {
        return res.status(404).json({ error: 'Alarm not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting alarm:', error);
      res.status(500).json({ error: 'Failed to delete alarm' });
    }
  }
}

export const alarmController = new AlarmController();