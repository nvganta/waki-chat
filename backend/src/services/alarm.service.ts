import { dbService } from './db.service';
import { Alarm, UserPreferences } from '../models/alarm.model';
import { v4 as uuidv4 } from 'uuid';

export class AlarmService {
  async createAlarm(userId: string, alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    const alarmId = uuidv4();
    const newAlarm: Alarm = {
      ...alarm,
      id: alarmId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbService.alarms.push(newAlarm);
    await dbService.save();
    return newAlarm;
  }

  async getAlarmsByUser(userId: string): Promise<Alarm[]> {
    return dbService.alarms
      .filter(alarm => alarm.userId === userId)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async getAlarm(alarmId: string): Promise<Alarm | null> {
    const alarm = dbService.alarms.find(a => a.id === alarmId);
    return alarm || null;
  }

  async updateAlarm(alarmId: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    const alarmIndex = dbService.alarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) {
      return null;
    }

    const updatedAlarm = {
      ...dbService.alarms[alarmIndex],
      ...updates,
      updatedAt: new Date(),
    };
    dbService.alarms[alarmIndex] = updatedAlarm;
    await dbService.save();
    return updatedAlarm;
  }

  async deleteAlarm(alarmId: string): Promise<boolean> {
    const initialLength = dbService.alarms.length;
    const filteredAlarms = dbService.alarms.filter(a => a.id !== alarmId);
    if (filteredAlarms.length < initialLength) {
      dbService.alarms.length = 0; // Clear the array
      dbService.alarms.push(...filteredAlarms);
      await dbService.save();
      return true;
    }
    return false;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return dbService.userPreferences[userId] || null;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const existingPrefs = dbService.userPreferences[userId];

    if (!existingPrefs) {
      const newPreferences: UserPreferences = {
        userId,
        name: preferences.name || 'User',
        location: preferences.location || { city: 'New York', country: 'US' },
        voiceStyle: preferences.voiceStyle || 'friendly',
        includeWeather: preferences.includeWeather ?? true,
        includeNews: preferences.includeNews ?? false,
        newsTopics: preferences.newsTopics || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbService.userPreferences[userId] = newPreferences;
      await dbService.save();
      return newPreferences;
    }

    const updatedPrefs = {
      ...existingPrefs,
      ...preferences,
      updatedAt: new Date(),
    };
    dbService.userPreferences[userId] = updatedPrefs;
    await dbService.save();
    return updatedPrefs;
  }
}

export const alarmService = new AlarmService();