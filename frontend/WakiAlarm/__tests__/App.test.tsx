import React from 'react';
import { Button, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  cancelDeviceAlarm,
  openAccessSettings,
  readAlarmAccess,
  requestAlarmAccess,
  restoreDeviceAlarms,
  scheduleDeviceAlarm,
  scheduledAlarms,
} from '../src/services/deviceAlarms';
import App from '../App';

jest.mock('../src/services/deviceAlarms', () => ({
  ...jest.requireActual('../src/services/deviceAlarms'),
  cancelDeviceAlarm: jest.fn(),
  openAccessSettings: jest.fn(),
  readAlarmAccess: jest.fn(),
  requestAlarmAccess: jest.fn(),
  restoreDeviceAlarms: jest.fn(),
  scheduleDeviceAlarm: jest.fn(),
  scheduledAlarms: jest.fn(),
}));

const list = scheduledAlarms as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  list.mockResolvedValue([]);
  (readAlarmAccess as jest.Mock).mockResolvedValue(null);
  (requestAlarmAccess as jest.Mock).mockResolvedValue(null);
});

async function render() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  return tree;
}

const texts = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Text).map(node => node.props.children);

async function press(tree: ReactTestRenderer.ReactTestRenderer, title: string) {
  await act(async () => {
    await tree.root
      .findAllByType(Button)
      .find(node => node.props.title === title)!
      .props.onPress();
  });
}

test('opening the app re-arms saved alarms', async () => {
  const tree = await render();
  expect(restoreDeviceAlarms).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});

test('a stranger can set and cancel a local alarm', async () => {
  const tree = await render();
  expect(texts(tree)).toContain('No alarm scheduled yet.');

  list.mockResolvedValue([{ id: 'local-wake-up', time: '07:00', nextAt: 2000000000000 }]);
  await press(tree, 'Set alarm');
  expect(scheduleDeviceAlarm).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'local-wake-up', days: [], snoozeDuration: 10 }),
  );
  expect(texts(tree).some(text => String(text).startsWith('Scheduled for'))).toBe(true);

  list.mockResolvedValue([]);
  await press(tree, 'Cancel alarm');
  expect(cancelDeviceAlarm).toHaveBeenCalledWith('local-wake-up');
  expect(texts(tree)).toContain('No alarm scheduled yet.');
  await act(async () => tree.unmount());
});

test('missing exact-alarm access is explained up front and links to settings', async () => {
  (readAlarmAccess as jest.Mock).mockResolvedValue('exact');
  const tree = await render();
  expect(texts(tree).some(text => String(text).includes('Alarms & reminders'))).toBe(true);
  await press(tree, 'Open settings');
  expect(openAccessSettings).toHaveBeenCalledWith('exact');
  await act(async () => tree.unmount());
});

test('a permission failure never schedules an alarm', async () => {
  (requestAlarmAccess as jest.Mock).mockResolvedValue('notifications');
  const tree = await render();
  await press(tree, 'Set alarm');
  expect(scheduleDeviceAlarm).not.toHaveBeenCalled();
  expect(texts(tree)).toContain('No alarm scheduled yet.');
  expect(texts(tree).some(text => String(text).includes('Notifications are off'))).toBe(true);
  await act(async () => tree.unmount());
});
