import fs from 'fs/promises';
import path from 'path';
import { Alarm, UserPreferences } from '../models/alarm.model';

interface DbData {
  alarms: Alarm[];
  userPreferences: { [userId: string]: UserPreferences };
}

const dbPath = path.resolve(__dirname, '..', '..', 'db.json');

class DbService {
  private data: DbData = {
    alarms: [],
    userPreferences: {},
  };

  constructor() {
    this.readDb();
  }

  private async readDb() {
    try {
      await fs.access(dbPath);
      const fileContent = await fs.readFile(dbPath, 'utf-8');
      this.data = JSON.parse(fileContent) as DbData;
    } catch (error) {
      // If file doesn't exist, create it with initial data
      await this.writeDb();
    }
  }

  private async writeDb() {
    await fs.writeFile(dbPath, JSON.stringify(this.data, null, 2));
  }

  public get alarms() {
    return this.data.alarms;
  }

  public get userPreferences() {
    return this.data.userPreferences;
  }

  public async save() {
    await this.writeDb();
  }
}

export const dbService = new DbService();
