import React from 'react';
import {Button} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {firebaseAuth} from '../src/services/firebase';
import {previewDeviceAlarm, restoreDeviceAlarms} from '../src/services/deviceAlarms';
import App from '../App';

jest.mock('../src/services/firebase', () => ({firebaseAuth: {isConfigured: jest.fn(), onAuthStateChanged: jest.fn()}}));
jest.mock('../src/services/deviceAlarms', () => ({previewDeviceAlarm: jest.fn().mockResolvedValue(undefined), restoreDeviceAlarms: jest.fn().mockResolvedValue(undefined)}));
jest.mock('@react-navigation/native', () => ({NavigationContainer: ({children}: any) => children}));
jest.mock('react-native-gesture-handler', () => ({GestureHandlerRootView: ({children}: any) => children}));
jest.mock('@react-navigation/stack', () => ({createStackNavigator: () => ({Navigator: ({children}: any) => children, Screen: () => null})}));
jest.mock('@react-navigation/bottom-tabs', () => ({createBottomTabNavigator: () => ({Navigator: ({children}: any) => children, Screen: () => null})}));
jest.mock('../src/screens/LoginScreen', () => () => null);
jest.mock('../src/screens/AlarmListScreen', () => () => null);
jest.mock('../src/screens/AlarmDetailScreen', () => () => null);
jest.mock('../src/screens/SettingsScreen', () => () => null);
jest.mock('../src/screens/JournalScreen', () => () => null);
jest.mock('../src/screens/ChatScreen', () => () => null);
jest.mock('../src/screens/GoalsScreen', () => () => null);
jest.mock('../src/screens/AnalyticsScreen', () => () => null);

beforeEach(() => jest.clearAllMocks());

test('unconfigured account service leaves a usable local alarm preview', async () => {
  (firebaseAuth.isConfigured as jest.Mock).mockReturnValue(false);
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => { tree = ReactTestRenderer.create(<App />); });
  expect(firebaseAuth.onAuthStateChanged).not.toHaveBeenCalled();
  await act(async () => { tree.root.findByType(Button).props.onPress(); });
  expect(previewDeviceAlarm).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});

test('auth restoration restores device alarms and logout clears their owner', async () => {
  (firebaseAuth.isConfigured as jest.Mock).mockReturnValue(true);
  let notify!: (user: any) => void;
  const unsubscribe = jest.fn();
  (firebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation(callback => { notify = callback; return unsubscribe; });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => { tree = ReactTestRenderer.create(<App />); });
  await act(async () => notify({uid: 'alice'}));
  expect(restoreDeviceAlarms).toHaveBeenLastCalledWith('alice');
  await act(async () => notify(null));
  expect(restoreDeviceAlarms).toHaveBeenLastCalledWith(null);
  await act(async () => tree.unmount());
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
