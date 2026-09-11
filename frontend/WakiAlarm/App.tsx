import React, { useEffect, useState } from 'react';
import {View, Text, Button, Alert, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { firebaseAuth } from './src/services/firebase';
import {restoreDeviceAlarms, previewDeviceAlarm} from './src/services/deviceAlarms';
import LoginScreen from './src/screens/LoginScreen';
import AlarmListScreen from './src/screens/AlarmListScreen';
import AlarmDetailScreen from './src/screens/AlarmDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import JournalScreen from './src/screens/JournalScreen';
import ChatScreen from './src/screens/ChatScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f3460',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Alarms"
        component={AlarmListScreen}
        options={{
          tabBarLabel: 'Alarms',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarLabel: 'Journal',
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Goals',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Stats',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="AlarmDetail"
        component={AlarmDetailScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configured] = useState(() => firebaseAuth.isConfigured());

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    let mounted = true;
    const unsubscribe = firebaseAuth.onAuthStateChanged(currentUser => {
      setLoading(true);
      restoreDeviceAlarms(currentUser?.uid || null).then(() => {
        if (mounted) setUser(currentUser);
      }).catch(error => Alert.alert('Alarm restore failed', error.message))
        .finally(() => { if (mounted) setLoading(false); });
    });
    return () => { mounted = false; unsubscribe(); };
  }, [configured]);

  if (loading) return null;
  if (!configured) {
    return <View style={setupStyles.container}>
      <Text style={setupStyles.title}>Waki needs account setup</Text>
      <Text style={setupStyles.copy}>This build is not connected to sign-in yet. You can still try the alarm sound and voice controls.</Text>
      <Button title="Try the alarm" onPress={() => previewDeviceAlarm().catch(error => Alert.alert('Preview unavailable', error.message))} />
    </View>;
  }
  return <GestureHandlerRootView style={setupStyles.root}>
    <NavigationContainer>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>
  </GestureHandlerRootView>;
};

const setupStyles = StyleSheet.create({
  root: {flex: 1},
  container: {flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1a1a2e'},
  title: {fontSize: 24, color: '#fff', marginBottom: 16},
  copy: {fontSize: 16, color: '#ddd', marginBottom: 24},
});
export default App;
