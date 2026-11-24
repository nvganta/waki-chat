export const API_URL = __DEV__
  ? 'http://127.0.0.1:3000' // USB: adb reverse tcp:3000 tcp:3000
  : ''; // Set a verified backend URL before distributing a connected release build

export const APP_CONFIG = {
  appName: 'Waki Chat',
  version: '2.0.0',
  supportEmail: 'support@waki-chat.com',
};