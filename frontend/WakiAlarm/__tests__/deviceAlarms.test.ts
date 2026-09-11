import {NativeModules, Platform, Alert} from 'react-native';
import {aiAPI, preferencesAPI} from '../src/services/api';

jest.mock('../src/services/api', () => ({
  aiAPI: {prepareAlarmMessage: jest.fn()},
  preferencesAPI: {getPreferences: jest.fn()},
}));

const bridge = {
  schedule: jest.fn(), cancel: jest.fn(), preview: jest.fn(), restore: jest.fn(),
  setUser: jest.fn(), status: jest.fn(), openSettings: jest.fn(), scheduled: jest.fn(),
};
NativeModules.WakiAlarms = bridge;
const {scheduleDeviceAlarm, restoreDeviceAlarms, ensureAlarmAccess, previewDeviceAlarm, scheduledAlarms} = require('../src/services/deviceAlarms');
const alarm = {id: 'a', userId: 'alice', time: '07:00', days: [1, 2, 3, 4, 5], label: 'Morning', enabled: true, snoozeEnabled: true, snoozeDuration: 10};

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', {value: 'android'});
  Object.defineProperty(Platform, 'Version', {value: 32});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  bridge.status.mockResolvedValue({exact: true, notifications: true, fullScreen: true});
  (preferencesAPI.getPreferences as jest.Mock).mockResolvedValue({data: {name: 'Alice', wakeUpStyle: 'gentle'}});
  (aiAPI.prepareAlarmMessage as jest.Mock).mockResolvedValue({data: {message: 'Good morning, Alice.'}});
});

test('saved alarm, snooze duration, greeting, and pacing reach the native scheduler', async () => {
  await scheduleDeviceAlarm(alarm);
  expect(JSON.parse(bridge.schedule.mock.calls[0][0])).toEqual({...alarm, message: 'Good morning, Alice.', wakeUpStyle: 'gentle'});
});
test('network failure still schedules a local personalized greeting', async () => {
  (aiAPI.prepareAlarmMessage as jest.Mock).mockRejectedValue(new Error('offline'));
  await scheduleDeviceAlarm(alarm);
  expect(JSON.parse(bridge.schedule.mock.calls[0][0]).message).toContain('Alice');
});
test('disabled alarms cancel the device alarm without calling AI', async () => {
  await scheduleDeviceAlarm({...alarm, enabled: false});
  expect(bridge.cancel).toHaveBeenCalledWith('a');
  expect(aiAPI.prepareAlarmMessage).not.toHaveBeenCalled();
});
test('native scheduling errors propagate so the screen cannot claim success', async () => {
  bridge.schedule.mockRejectedValueOnce(new Error('permission revoked'));
  await expect(scheduleDeviceAlarm(alarm)).rejects.toThrow('permission revoked');
});
test('missing exact access directs the user to settings without scheduling', async () => {
  bridge.status.mockResolvedValueOnce({exact: false, notifications: true, fullScreen: true});
  await expect(ensureAlarmAccess()).rejects.toThrow('Alarms & reminders');
  expect(Alert.alert).toHaveBeenCalled();
  expect(bridge.schedule).not.toHaveBeenCalled();
});
test('restore assigns the signed-in user and logout clears that assignment', async () => {
  await restoreDeviceAlarms('alice');
  expect(bridge.setUser).toHaveBeenCalledWith('alice');
  expect(bridge.restore).toHaveBeenCalledTimes(1);
  await restoreDeviceAlarms(null);
  expect(bridge.setUser).toHaveBeenLastCalledWith('');
  expect(bridge.restore).toHaveBeenCalledTimes(1);
});
test('preview starts native playback without scheduling a recurring alarm', async () => {
  await previewDeviceAlarm();
  expect(bridge.preview).toHaveBeenCalled();
  expect(bridge.schedule).not.toHaveBeenCalled();
});
test('list reads persisted device timing instead of claiming server alarms are scheduled', async () => {
  bridge.scheduled.mockResolvedValue(JSON.stringify([{...alarm, nextAt: 1234, snoozeAt: 5678}]));
  expect(await scheduledAlarms()).toEqual([{...alarm, nextAt: 1234, snoozeAt: 5678}]);
});
