import {Alert, NativeModules, PermissionsAndroid, Platform} from 'react-native';
import {Alarm} from '../types';
import {aiAPI, preferencesAPI} from './api';

interface ScheduledAlarm extends Alarm { nextAt: number; snoozeAt?: number }
interface AlarmBridge {
  status(): Promise<{exact: boolean; notifications: boolean; fullScreen: boolean}>;
  openSettings(kind: string): void;
  schedule(json: string): Promise<number>;
  scheduled(): Promise<string>;
  cancel(id: string): Promise<void>;
  setUser(user: string): Promise<void>;
  restore(): Promise<void>;
  preview(json: string): Promise<void>;
}
const bridge = NativeModules.WakiAlarms as AlarmBridge | undefined;
function native(): AlarmBridge {
  if (Platform.OS !== 'android' || !bridge) throw new Error('Device alarms currently require the Android build.');
  return bridge;
}

export async function ensureAlarmAccess() {
  const module = native();
  if (Number(Platform.Version) >= 33) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  const status = await module.status();
  const missing = !status.exact ? 'exact' : !status.notifications ? 'notifications' : !status.fullScreen ? 'fullScreen' : null;
  if (missing) {
    const message = missing === 'exact' ? 'Allow Alarms & reminders, then return and save again.'
      : missing === 'notifications' ? 'Allow notifications so Waki can show alarm controls, then save again.'
      : 'Allow full-screen alarms, then return and save again.';
    Alert.alert('Alarm permission needed', message, [{text: 'Later'}, {text: 'Open settings', onPress: () => module.openSettings(missing)}]);
    throw new Error(message);
  }
}

async function greeting() {
  let message = 'Good morning. Time to wake up. You can stop the alarm or snooze for a little longer.';
  let wakeUpStyle = 'moderate';
  try {
    const {data} = await preferencesAPI.getPreferences();
    wakeUpStyle = data.wakeUpStyle || 'moderate';
    message = `Good morning${data.name ? `, ${data.name}` : ''}. Time to wake up. Take a breath and start your day.`;
  } catch { /* The alarm still rings without a saved profile or network. */ }
  try { message = (await aiAPI.prepareAlarmMessage()).data.message || message; } catch { /* Save the local greeting instead. */ }
  return {message, wakeUpStyle};
}

export async function scheduleDeviceAlarm(alarm: Alarm) {
  if (!alarm.id) throw new Error('Save the alarm before scheduling it.');
  if (!alarm.enabled) return native().cancel(alarm.id);
  return native().schedule(JSON.stringify({...alarm, ...await greeting()}));
}
export async function previewDeviceAlarm() {
  await ensureAlarmAccess();
  await native().preview(JSON.stringify({label: 'Try your wake-up', ...await greeting()}));
}
export async function scheduledAlarms(): Promise<ScheduledAlarm[]> {
  return JSON.parse(await native().scheduled());
}
export const cancelDeviceAlarm = (id: string) => native().cancel(id);
export async function restoreDeviceAlarms(userId: string | null) {
  if (Platform.OS !== 'android' || !bridge) return;
  await bridge.setUser(userId || '');
  if (userId) await bridge.restore();
}
