import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import { weatherService } from '../services/weather.service';
import { alarmService } from '../services/alarm.service';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const upload = multer({ dest: 'temp/' });

export class AIController {
  async generateWakeUpMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      // Get user preferences
      const preferences = await alarmService.getUserPreferences(userId);
      if (!preferences) {
        return res.status(404).json({ error: 'User preferences not found' });
      }

      // Get weather data
      const weather = await weatherService.getWeatherByCity(
        preferences.location.city,
        preferences.location.country
      );

      // Generate message
      const message = await aiService.generateWakeUpMessage(
        preferences.name,
        weather,
        preferences
      );

      res.json({ message, weather });
    } catch (error) {
      console.error('Error generating wake-up message:', error);
      res.status(500).json({ error: 'Failed to generate wake-up message' });
    }
  }

  async generateAudio(req: AuthRequest, res: Response) {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Generate audio
      const audioBuffer = await aiService.generateAudioFromText(text);
      
      // Set appropriate headers
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error('Error generating audio:', error);
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  }

  async processVoiceCommand(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const audioPath = req.file.path;
      
      try {
        // Process the voice command
        const transcription = await aiService.processVoiceCommand(audioPath);
        
        // Interpret the command
        let action = 'unknown';
        if (transcription.includes('stop') || transcription.includes('off')) {
          action = 'stop';
        } else if (transcription.includes('snooze') || transcription.includes('later')) {
          action = 'snooze';
        }

        res.json({ transcription, action });
      } finally {
        // Clean up the temporary file
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      res.status(500).json({ error: 'Failed to process voice command' });
    }
  }

  async testAlarm(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      
      // Get user preferences
      const preferences = await alarmService.getUserPreferences(userId);
      if (!preferences) {
        return res.status(404).json({ error: 'User preferences not found' });
      }

      // Get weather data
      const weather = await weatherService.getWeatherByCity(
        preferences.location.city,
        preferences.location.country
      );

      // Generate message
      const message = await aiService.generateWakeUpMessage(
        preferences.name,
        weather,
        preferences
      );

      // Generate audio
      const audioBuffer = await aiService.generateAudioFromText(message);

      // Send as base64 for easy testing
      res.json({
        message,
        weather,
        audio: audioBuffer.toString('base64'),
      });
    } catch (error) {
      console.error('Error testing alarm:', error);
      res.status(500).json({ error: 'Failed to test alarm' });
    }
  }
}

export const aiController = new AIController();
export const uploadMiddleware = upload;