import { aiService } from './ai.service';
import { journalService } from './journal.service';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const audioUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  },
});

export class VoiceJournalService {
  async processVoiceJournal(
    userId: string,
    audioFilePath: string,
    keepAudio: boolean = true
  ): Promise<{
    entryId: string;
    transcription: string;
    mood: string;
    tags: string[];
    audioUrl?: string;
  }> {
    try {
      // Transcribe the audio using OpenAI Whisper
      const transcription = await aiService.processVoiceCommand(audioFilePath);
      
      // Analyze the transcription for mood and tags
      const moodAnalysis = await journalService.analyzeMood(transcription);
      
      // Store audio file URL if keeping audio
      let audioUrl: string | undefined;
      if (keepAudio) {
        audioUrl = `/uploads/audio/${path.basename(audioFilePath)}`;
      } else {
        // Delete the audio file if not keeping it
        fs.unlinkSync(audioFilePath);
      }
      
      // Create journal entry
      const entryId = await journalService.createEntry({
        userId,
        content: transcription,
        mood: moodAnalysis.mood,
        tags: [...moodAnalysis.tags, 'voice-journal'],
        audioUrl,
        createdAt: new Date(),
        sentiment: moodAnalysis.sentiment,
      });
      
      return {
        entryId,
        transcription,
        mood: moodAnalysis.mood,
        tags: moodAnalysis.tags,
        audioUrl,
      };
    } catch (error) {
      console.error('Error processing voice journal:', error);
      throw new Error('Failed to process voice journal');
    }
  }

  async generateDailySummary(userId: string): Promise<string> {
    try {
      // Get today's entries
      const entries = await journalService.getEntries(userId, 50);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysEntries = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
      
      if (todaysEntries.length === 0) {
        return "No journal entries for today yet. Start recording your thoughts!";
      }
      
      // Generate summary using AI
      const entriesText = todaysEntries
        .map(e => `[${e.mood}] ${e.content}`)
        .join('\n\n');
      
      const prompt = `Summarize these journal entries from today into a cohesive daily reflection. 
      Highlight key themes, emotions, and insights. Keep it personal and encouraging.
      
      Entries:
      ${entriesText}
      
      Provide a 2-3 paragraph summary that captures the essence of the day.`;
      
      const { getFriendliCompletion } = require('./friendli.service');
      const summary = await getFriendliCompletion(prompt);
      
      return summary;
    } catch (error) {
      console.error('Error generating daily summary:', error);
      throw new Error('Failed to generate daily summary');
    }
  }

  async getAudioInsights(userId: string, days: number = 7): Promise<{
    totalRecordings: number;
    totalDuration: number;
    averageMood: string;
    topWords: string[];
    speakingPatterns: any;
  }> {
    try {
      const entries = await journalService.getEntries(userId, 100);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const voiceEntries = entries.filter(entry => 
        entry.audioUrl && new Date(entry.createdAt) > cutoffDate
      );
      
      // Calculate statistics
      const moodCounts: { [key: string]: number } = {};
      const allWords: string[] = [];
      
      voiceEntries.forEach(entry => {
        // Count moods
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        
        // Extract words for frequency analysis
        const words = entry.content.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 4); // Only words longer than 4 chars
        allWords.push(...words);
      });
      
      // Find most common mood
      const averageMood = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
      
      // Find top words
      const wordFrequency: { [key: string]: number } = {};
      allWords.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
      
      const topWords = Object.entries(wordFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
      
      return {
        totalRecordings: voiceEntries.length,
        totalDuration: voiceEntries.length * 60, // Estimate 1 min per recording
        averageMood,
        topWords,
        speakingPatterns: {
          averageLength: Math.round(allWords.length / voiceEntries.length),
          vocabularySize: new Set(allWords).size,
        },
      };
    } catch (error) {
      console.error('Error getting audio insights:', error);
      throw new Error('Failed to get audio insights');
    }
  }
}

export const voiceJournalService = new VoiceJournalService();