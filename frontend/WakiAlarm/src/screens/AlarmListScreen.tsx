import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { alarmAPI } from '../services/api';
import { Alarm } from '../types';

const AlarmListScreen = ({ navigation }: any) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlarms();
  }, []);

  const fetchAlarms = async () => {
    try {
      const response = await alarmAPI.getAlarms();
      setAlarms(response.data);
    } catch (error) {
      console.error('Error fetching alarms:', error);
      Alert.alert('Error', 'Failed to load alarms');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlarm = async (alarm: Alarm) => {
    try {
      await alarmAPI.updateAlarm(alarm.id!, { enabled: !alarm.enabled });
      fetchAlarms();
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
    if (days.length === 0) return 'No days selected';
    return days.map(d => dayNames[d]).join(', ');
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
        </View>
        <Switch
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