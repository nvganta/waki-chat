import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { Alarm } from '../types';

export interface ScheduledAlarm extends Alarm {
  nextAt: number;
  snoozeAt?: number;
}

export interface AlarmAccess {
  exact: boolean;
  notifications: boolean;
  fullScreen: boolean;
}

export type MissingAccess = 'exact' | 'notifications' | 'fullScreen';

interface AlarmBridge {
  status(): Promise<AlarmAccess>;
  openSettings(kind: MissingAccess): void;
  schedule(json: string): Promise<number>;
  scheduled(): Promise<string>;
  cancel(id: string): Promise<void>;
  restore(): Promise<void>;
}

const bridge = NativeModules.WakiAlarms as AlarmBridge | undefined;

function native(): AlarmBridge {
  if (Platform.OS !== 'android' || !bridge) {
    throw new Error('Device alarms currently require the Android build.');
  }
  return bridge;
}

/** Plain-language reasons shown when Android is blocking part of the alarm. */
export const accessExplanation: Record<MissingAccess, string> = {
  exact:
    'Android is not letting Waki ring at an exact time. Turn on "Alarms & reminders" for Waki, then come back.',
  notifications:
    'Notifications are off, so the alarm cannot show Stop and Snooze on your lock screen. Turn them on for Waki.',
  fullScreen:
    'Full-screen alarms are off, so the alarm cannot take over the lock screen. Allow them for Waki.',
};

export function firstMissingAccess(status: AlarmAccess): MissingAccess | null {
  if (!status.exact) return 'exact';
  if (!status.notifications) return 'notifications';
  if (!status.fullScreen) return 'fullScreen';
  return null;
}

/** Reports what Android is still blocking, without showing any permission dialog. */
export async function readAlarmAccess(): Promise<MissingAccess | null> {
  return firstMissingAccess(await native().status());
}

/** Asks for the notification permission when Android needs it, then reports what is still missing. */
export async function requestAlarmAccess(): Promise<MissingAccess | null> {
  const module = native();
  if (Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  return firstMissingAccess(await module.status());
}

export function openAccessSettings(kind: MissingAccess) {
  native().openSettings(kind);
}

const localGreeting = { message: 'Good morning. Time to wake up.', wakeUpStyle: 'moderate' };

export async function scheduleDeviceAlarm(alarm: Alarm) {
  if (!alarm.id) throw new Error('Save the alarm before scheduling it.');
  if (!alarm.enabled) return native().cancel(alarm.id);
  return native().schedule(JSON.stringify({ ...alarm, ...localGreeting }));
}

export async function scheduledAlarms(): Promise<ScheduledAlarm[]> {
  return JSON.parse(await native().scheduled());
}

export const cancelDeviceAlarm = (id: string) => native().cancel(id);

/** Re-arms saved alarms, for example after Android dropped them on a force stop. */
export const restoreDeviceAlarms = () => native().restore();
