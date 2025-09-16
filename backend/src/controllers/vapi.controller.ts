import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { vapiService } from '../services/vapi.service';
import { weatherService } from '../services/weather.service';

export class VapiController {
  async createWebCall(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { userName, location, alarmTime } = req.body;

      // Get weather data if location provided
      let weather;
      if (location) {
        try {
          weather = await weatherService.getWeather(location);
        } catch (error) {
          console.error('Failed to fetch weather:', error);
        }
      }

      const context = {
        userName: userName || 'Friend',
        weather,
        currentTime: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }),
        alarmTime,
        preferences: req.body.preferences,
      };

      const webCall = await vapiService.createWebCall(context);

      res.json({
        success: true,
        ...webCall,
      });
    } catch (error) {
      console.error('Error creating web call:', error);
      res.status(500).json({ error: 'Failed to create voice call' });
    }
  }

  async createPhoneCall(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { phoneNumber, userName, location, alarmTime } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Get weather data if location provided
      let weather;
      if (location) {
        try {
          weather = await weatherService.getWeather(location);
        } catch (error) {
          console.error('Failed to fetch weather:', error);
        }
      }

      const context = {
        userName: userName || 'Friend',
        weather,
        currentTime: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }),
        alarmTime,
        preferences: req.body.preferences,
      };

      const call = await vapiService.createPhoneCall(phoneNumber, context);

      res.json({
        success: true,
        callId: call.id,
        status: call.status,
      });
    } catch (error) {
      console.error('Error creating phone call:', error);
      res.status(500).json({ error: 'Failed to initiate phone call' });
    }
  }

  async endCall(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId } = req.params;

      if (!callId) {
        return res.status(400).json({ error: 'Call ID is required' });
      }

      await vapiService.endCall(callId);

      res.json({ success: true, message: 'Call ended successfully' });
    } catch (error) {
      console.error('Error ending call:', error);
      res.status(500).json({ error: 'Failed to end call' });
    }
  }

  async getTranscript(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { callId } = req.params;

      if (!callId) {
        return res.status(400).json({ error: 'Call ID is required' });
      }

      const transcript = await vapiService.getCallTranscript(callId);

      res.json({ transcript });
    } catch (error) {
      console.error('Error fetching transcript:', error);
      res.status(500).json({ error: 'Failed to fetch transcript' });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const event = req.body;

      // Verify webhook signature if provided by Vapi
      // TODO: Add signature verification

      await vapiService.handleWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
}

export const vapiController = new VapiController();