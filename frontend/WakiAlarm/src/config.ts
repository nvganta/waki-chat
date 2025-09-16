export const API_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://api.waki-chat.com';

export const VAPI_CONFIG = {
  publicKey: process.env.VAPI_PUBLIC_KEY || '',
};

export const APP_CONFIG = {
  appName: 'Waki Chat',
  version: '2.0.0',
  supportEmail: 'support@waki-chat.com',
};