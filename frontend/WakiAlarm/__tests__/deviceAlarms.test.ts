import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const bridge = {
  schedule: jest.fn(),
  cancel: jest.fn(),
  restore: jest.fn(),
  status: jest.fn(),
  openSettings: jest.fn(),
  scheduled: jest.fn(),
};
NativeModules.WakiAlarms = bridge;
const {
  scheduleDeviceAlarm,
  readAlarmAccess,
  requestAlarmAccess,
  restoreDeviceAlarms,
  scheduledAlarms,
} = require('../src/services/deviceAlarms');

const alarm = {
  id: 'a',
  userId: 'local',
  time: '07:00',
  days: [1, 2, 3, 4, 5],
  label: 'Morning',
  enabled: true,
  snoozeEnabled: true,
  snoozeDuration: 10,
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { value: 'android' });
  Object.defineProperty(Platform, 'Version', { value: 32 });
  bridge.status.mockResolvedValue({ exact: true, notifications: true, fullScreen: true });
});

test('saved alarm and local greeting reach the native scheduler', async () => {
  await scheduleDeviceAlarm(alarm);
  expect(JSON.parse(bridge.schedule.mock.calls[0][0])).toEqual({
    ...alarm,
    message: 'Good morning. Time to wake up.',
    wakeUpStyle: 'moderate',
  });
});

test('disabled alarms cancel the device alarm', async () => {
  await scheduleDeviceAlarm({ ...alarm, enabled: false });
  expect(bridge.cancel).toHaveBeenCalledWith('a');
  expect(bridge.schedule).not.toHaveBeenCalled();
});

test('native scheduling errors propagate so the screen cannot claim success', async () => {
  bridge.schedule.mockRejectedValueOnce(new Error('permission revoked'));
  await expect(scheduleDeviceAlarm(alarm)).rejects.toThrow('permission revoked');
});

test('missing exact-alarm access is reported before anything else', async () => {
  bridge.status.mockResolvedValueOnce({ exact: false, notifications: false, fullScreen: true });
  expect(await readAlarmAccess()).toBe('exact');
});

test('full access reports nothing missing', async () => {
  expect(await readAlarmAccess()).toBeNull();
});

test('Android 13 and later ask for notifications only when the user sets an alarm', async () => {
  Object.defineProperty(Platform, 'Version', { value: 33 });
  const request = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');
  await readAlarmAccess();
  expect(request).not.toHaveBeenCalled();
  await requestAlarmAccess();
  expect(request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
});

test('restore re-arms saved alarms through the native bridge', async () => {
  await restoreDeviceAlarms();
  expect(bridge.restore).toHaveBeenCalledTimes(1);
});

test('list reads persisted device timing', async () => {
  bridge.scheduled.mockResolvedValue(JSON.stringify([{ ...alarm, nextAt: 1234, snoozeAt: 5678 }]));
  expect(await scheduledAlarms()).toEqual([{ ...alarm, nextAt: 1234, snoozeAt: 5678 }]);
});
