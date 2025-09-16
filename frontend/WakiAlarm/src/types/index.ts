export interface Alarm {
  id?: string;
  userId: string;
  time: string;
  days: number[];
  enabled: boolean;
  label: string;
  snoozeEnabled: boolean;
  snoozeDuration: number;
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
}

export interface WeatherData {
  temperature: number;
  description: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
}