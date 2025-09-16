import { openai } from '../config/openai';
import { WeatherData } from './weather.service';
import { UserPreferences } from '../models/alarm.model';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getFriendliCompletion } from './friendli.service';

export class AIService {
  async generateWakeUpMessage(
    userName: string,
    weather: WeatherData,
    preferences: UserPreferences
  ): Promise<string> {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    const dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const voiceStyles = {
      friendly: 'warm, cheerful, and conversational',
      professional: 'clear, informative, and business-like',
      energetic: 'enthusiastic, upbeat, and motivating',
      calm: 'gentle, soothing, and peaceful',
    };

    const prompt = `Generate a wake-up greeting message for ${userName}. 
    Current time: ${timeString}
    Date: ${dateString}
    Weather in ${weather.city}: ${weather.temperature}°C, ${weather.description}
    
    Style: Be ${voiceStyles[preferences.voiceStyle]}. 
    Keep it concise (2-3 sentences max).
    Include the time, a greeting, and weather information.
    Make it natural and conversational, as if a friendly assistant is waking them up.`;

    try {
      // Replace OpenAI call with Friendli.ai
      const completion = await getFriendliCompletion(prompt);
      return completion || 'Good morning! Time to wake up!';
    } catch (error) {
      console.error('Error generating wake-up message:', error);
      return `Good morning ${userName}! It's ${timeString}. The weather in ${weather.city} is ${weather.temperature}°C with ${weather.description}. Have a great day!`;
    }
  }

  async generateAudioFromText(text: string): Promise<Buffer> {
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Error generating audio:', error);
      throw new Error('Failed to generate audio');
    }
  }

  async saveAudioFile(audioBuffer: Buffer): Promise<string> {
    const filename = `${uuidv4()}.mp3`;
    const filepath = path.join(__dirname, '../../temp', filename);
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filepath, audioBuffer);
    return filepath;
  }

  async processVoiceCommand(audioFilePath: string): Promise<string> {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
      });

      return transcription.text.toLowerCase();
    } catch (error) {
      console.error('Error processing voice command:', error);
      throw new Error('Failed to process voice command');
    }
  }
}

export const aiService = new AIService();