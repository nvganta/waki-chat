import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, UserPreferences } from '../types';

import {API_URL} from '../config';
import {firebaseAuth} from './firebase';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    if (!API_URL) throw new Error('The backend URL is not configured for this build.');
    const token = await firebaseAuth.getCurrentUser()?.getIdToken() || await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const alarmAPI = {
  createAlarm: (alarm: Omit<Alarm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    api.post<Alarm>('/alarms', alarm),

  getAlarms: () => api.get<Alarm[]>('/alarms'),

  getAlarm: (id: string) => api.get<Alarm>(`/alarms/${id}`),

  updateAlarm: (id: string, updates: Partial<Alarm>) =>
    api.put<Alarm>(`/alarms/${id}`, updates),

  deleteAlarm: (id: string) => api.delete(`/alarms/${id}`),
};

export const preferencesAPI = {
  getPreferences: () => api.get<UserPreferences>('/preferences'),

  updatePreferences: (updates: Partial<UserPreferences>) =>
    api.put<UserPreferences>('/preferences', updates),
};

export const aiAPI = {
  prepareAlarmMessage: () => api.get<{message: string}>('/ai/alarm-message'),
  generateWakeUpMessage: () =>
    api.post<{ message: string; weather: any }>('/ai/wake-message'),

  generateAudio: (text: string) =>
    api.post('/ai/generate-audio', { text }, { responseType: 'arraybuffer' }),

  processVoiceCommand: (audioFile: any) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.post<{ transcription: string; action: string }>(
      '/ai/voice-command',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  testAlarm: () =>
    api.get<{ message: string; weather: any; audio: string }>('/ai/test-alarm'),
};

export default api;