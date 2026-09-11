import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  AppState,
} from 'react-native';
import { alarmAPI } from '../services/api';
import {ensureAlarmAccess, scheduleDeviceAlarm, cancelDeviceAlarm, scheduledAlarms, previewDeviceAlarm} from '../services/deviceAlarms';
import { Alarm } from '../types';

const AlarmListScreen = ({ navigation }: any) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [nextTimes, setNextTimes] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAlarms = useCallback(async () => {
    try {
      const local = await scheduledAlarms();
      setNextTimes(Object.fromEntries(local.map(alarm => [alarm.id!, alarm.snoozeAt || alarm.nextAt])));
      try { setAlarms((await alarmAPI.getAlarms()).data); }
      catch { setAlarms(local); }
    } catch (error) {
      Alert.alert('Error', 'Failed to load alarms on this phone');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchAlarms();
    const unsubscribe = navigation.addListener('focus', fetchAlarms);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') fetchAlarms(); });
    return () => { unsubscribe(); subscription.remove(); };
  }, [navigation, fetchAlarms]);

  const toggleAlarm = async (alarm: Alarm) => {
    try {
      if (alarm.enabled) await cancelDeviceAlarm(alarm.id!);
      else await ensureAlarmAccess();
      const response = await alarmAPI.updateAlarm(alarm.id!, { enabled: !alarm.enabled });
      if (response.data.enabled) await scheduleDeviceAlarm(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to update alarm');
    }
  };

  const deleteAlarm = async (id: string) => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDeviceAlarm(id);
              await alarmAPI.deleteAlarm(id);
              fetchAlarms();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  const formatDays = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (days.length === 7) return 'Every day';
    if (days.length === 0) return 'Once';
    return days.map(d => dayNames[d]).join(', ');
  };

  const scheduleHere = async (alarm: Alarm) => {
    if (busy) return;
    setBusy(true);
    try { await ensureAlarmAccess(); await scheduleDeviceAlarm(alarm); await fetchAlarms(); }
    catch (error) { Alert.alert('Alarm not scheduled', error instanceof Error ? error.message : 'Please retry.'); }
    finally { setBusy(false); }
  };
  const preview = async () => {
    if (busy) return;
    setBusy(true);
    try { await previewDeviceAlarm(); }
    catch (error) { Alert.alert('Preview unavailable', error instanceof Error ? error.message : 'Please retry.'); }
    finally { setBusy(false); }
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <TouchableOpacity
      style={styles.alarmCard}
      onPress={() => navigation.navigate('AlarmDetail', { alarmId: item.id })}
      onLongPress={() => deleteAlarm(item.id!)}
    >
      <View style={styles.alarmContent}>
        <View>
          <Text style={styles.alarmTime}>{item.time}</Text>
          <Text style={styles.alarmLabel}>{item.label}</Text>
          <Text style={styles.alarmDays}>{formatDays(item.days)}</Text>
          {item.enabled && <Text style={styles.alarmDays}>{nextTimes[item.id!] > Date.now()
            ? `On this phone: ${new Date(nextTimes[item.id!]).toLocaleString()}`
            : 'Not scheduled on this phone'}</Text>}
          {item.enabled && !(nextTimes[item.id!] > Date.now()) && <TouchableOpacity disabled={busy} onPress={() => scheduleHere(item)}>
            <Text style={styles.alarmLabel}>{busy ? 'Scheduling…' : 'Schedule on this phone'}</Text>
          </TouchableOpacity>}
        </View>
        <Switch
          disabled={busy}
          value={item.enabled}
          onValueChange={() => toggleAlarm(item)}
          trackColor={{ false: '#767577', true: '#e94560' }}
          thumbColor={item.enabled ? '#fff' : '#f4f3f4'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Alarms</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AlarmDetail')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity disabled={busy} onPress={preview} accessibilityRole="button">
        <Text style={[styles.alarmLabel, styles.preview]}>{busy ? 'Preparing…' : 'Try my wake-up now'}</Text>
      </TouchableOpacity>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alarms yet</Text>
          <Text style={styles.emptySubtext}>Tap + to create your first alarm</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          renderItem={renderAlarm}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  preview: {textAlign: 'center', padding: 12},
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  alarmCard: {
    backgroundColor: '#0f3460',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  alarmContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  alarmLabel: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  alarmDays: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default AlarmListScreen;