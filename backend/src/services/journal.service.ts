import { getWeaviateClient } from '../config/weaviate';
import { v4 as uuidv4 } from 'uuid';
import { getFriendliCompletion } from './friendli.service';

interface JournalEntry {
  id?: string;
  userId: string;
  content: string;
  mood?: string;
  tags?: string[];
  audioUrl?: string;
  createdAt: Date;
  sentiment?: number;
}

interface MoodAnalysis {
  mood: string;
  sentiment: number;
  tags: string[];
}

export class JournalService {
  async createEntry(entry: JournalEntry): Promise<string> {
    try {
      const client = await getWeaviateClient();
      const journal = client.collections.get('Journal');
      
      // Analyze mood and sentiment if not provided
      if (!entry.mood || entry.sentiment === undefined) {
        const analysis = await this.analyzeMood(entry.content);
        entry.mood = entry.mood || analysis.mood;
        entry.sentiment = entry.sentiment ?? analysis.sentiment;
        entry.tags = entry.tags || analysis.tags;
      }
      
      const result = await journal.data.insert({
        userId: entry.userId,
        content: entry.content,
        mood: entry.mood || 'neutral',
        tags: entry.tags || [],
        audioUrl: entry.audioUrl || '',
        createdAt: entry.createdAt,
        sentiment: entry.sentiment || 0,
      });
      
      return result.id;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw new Error('Failed to create journal entry');
    }
  }

  async getEntries(userId: string, limit: number = 10): Promise<JournalEntry[]> {
    try {
      const client = await getWeaviateClient();
      const journal = client.collections.get('Journal');
      
      const result = await journal.query.fetchObjects({
        where: {
          path: ['userId'],
          operator: 'Equal',
          valueText: userId,
        },
        limit,
        sort: {
          path: ['createdAt'],
          order: 'desc',
        },
      });
      
      return result.objects.map(obj => ({
        id: obj.uuid,
        userId: obj.properties.userId as string,
        content: obj.properties.content as string,
        mood: obj.properties.mood as string,
        tags: obj.properties.tags as string[],
        audioUrl: obj.properties.audioUrl as string,
        createdAt: new Date(obj.properties.createdAt as string),
        sentiment: obj.properties.sentiment as number,
      }));
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw new Error('Failed to fetch journal entries');
    }
  }

  async searchEntries(userId: string, query: string, limit: number = 10): Promise<JournalEntry[]> {
    try {
      const client = await getWeaviateClient();
      const journal = client.collections.get('Journal');
      
      const result = await journal.query.nearText(query, {
        where: {
          path: ['userId'],
          operator: 'Equal',
          valueText: userId,
        },
        limit,
      });
      
      return result.objects.map(obj => ({
        id: obj.uuid,
        userId: obj.properties.userId as string,
        content: obj.properties.content as string,
        mood: obj.properties.mood as string,
        tags: obj.properties.tags as string[],
        audioUrl: obj.properties.audioUrl as string,
        createdAt: new Date(obj.properties.createdAt as string),
        sentiment: obj.properties.sentiment as number,
      }));
    } catch (error) {
      console.error('Error searching journal entries:', error);
      throw new Error('Failed to search journal entries');
    }
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    try {
      const client = await getWeaviateClient();
      const journal = client.collections.get('Journal');
      
      // Verify ownership before deletion
      const entry = await journal.query.fetchObjectById(entryId);
      
      if (entry?.properties.userId !== userId) {
        throw new Error('Unauthorized to delete this entry');
      }
      
      await journal.data.deleteById(entryId);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw new Error('Failed to delete journal entry');
    }
  }

  async analyzeMood(content: string): Promise<MoodAnalysis> {
    const prompt = `Analyze the following journal entry and provide:
    1. Primary mood (one word: happy, sad, anxious, excited, calm, frustrated, grateful, etc.)
    2. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
    3. 2-4 relevant tags (short keywords)
    
    Journal entry: "${content}"
    
    Respond in JSON format: {"mood": "...", "sentiment": 0.5, "tags": ["...", "..."]}`;

    try {
      const response = await getFriendliCompletion(prompt);
      const analysis = JSON.parse(response);
      
      return {
        mood: analysis.mood || 'neutral',
        sentiment: analysis.sentiment || 0,
        tags: analysis.tags || [],
      };
    } catch (error) {
      console.error('Error analyzing mood:', error);
      return {
        mood: 'neutral',
        sentiment: 0,
        tags: [],
      };
    }
  }

  async getMoodStats(userId: string, days: number = 30): Promise<any> {
    try {
      const client = await getWeaviateClient();
      const journal = client.collections.get('Journal');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const result = await journal.aggregate.overAll({
        where: {
          operator: 'And',
          operands: [
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
            {
              path: ['createdAt'],
              operator: 'GreaterThan',
              valueDate: startDate.toISOString(),
            },
          ],
        },
        groupBy: {
          property: 'mood',
        },
      });
      
      return result;
    } catch (error) {
      console.error('Error getting mood stats:', error);
      throw new Error('Failed to get mood statistics');
    }
  }
}

export const journalService = new JournalService();