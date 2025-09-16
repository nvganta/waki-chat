export interface Alarm {
  id?: string;
  userId: string;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  label: string;
  snoozeEnabled: boolean;
  snoozeDuration: number; // minutes
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferences {
  userId: string;
  name: string;
  location: {
    city: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  voiceStyle: 'friendly' | 'professional' | 'energetic' | 'calm';
  includeWeather: boolean;
  includeNews: boolean;
  newsTopics?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}