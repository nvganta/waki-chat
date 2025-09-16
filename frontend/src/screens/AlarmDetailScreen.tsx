import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { alarmAPI } from '../services/api';
import { Alarm } from '../types';

const AlarmDetailScreen = ({ navigation, route }: any) => {
  const alarmId = route.params?.alarmId;
  const [time, setTime] = useState(new Date());
  const [label, setLabel] = useState('Wake up');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); // Weekdays by default
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alarmId) {
      fetchAlarm();
    }
  }, [alarmId]);

  const fetchAlarm = async () => {
    try {
      const response = await alarmAPI.getAlarm(alarmId);
      const alarm = response.data;
      
      // Parse time string to Date
      const [hours, minutes] = alarm.time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      
      setTime(date);
      setLabel(alarm.label);
      setDays(alarm.days);
      setSnoozeEnabled(alarm.snoozeEnabled);
      setSnoozeDuration(alarm.snoozeDuration);
    } catch (error) {
      Alert.alert('Error', 'Failed to load alarm');
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const alarmData = {
        time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
        label,
        days,
        enabled: true,
        snoozeEnabled,
        snoozeDuration,
      };

      if (alarmId) {
        await alarmAPI.updateAlarm(alarmId, alarmData);
      } else {
        await alarmAPI.createAlarm(alarmData);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save alarm');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day].sort());
    }
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{alarmId ? 'Edit Alarm' : 'New Alarm'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.headerButton, styles.saveButton]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.timePickerContainer}>
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={(event, selectedTime) => {
              if (selectedTime) setTime(selectedTime);
            }}
            textColor="#fff"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm label"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <View style={styles.daysContainer}>
            {dayNames.map((dayName, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  days.includes(index) && styles.dayButtonActive,
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    days.includes(index) && styles.dayButtonTextActive,
                  ]}
                >
                  {dayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Snooze</Text>
            <Switch
              value={snoozeEnabled}
              onValueChange={setSnoozeEnabled}
              trackColor={{ false: '#767577', true: '#e94560' }}
              thumbColor={snoozeEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {snoozeEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Snooze Duration</Text>
            <View style={styles.snoozeOptions}>
              {[5, 10, 15, 20].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.snoozeOption,
                    snoozeDuration === duration && styles.snoozeOptionActive,
                  ]}
                  onPress={() => setSnoozeDuration(duration)}
                >
                  <Text
                    style={[
                      styles.snoozeOptionText,
                      snoozeDuration === duration && styles.snoozeOptionTextActive,
                    ]}
                  >
                    {duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
  headerButton: {
    fontSize: 16,
    color: '#999',
  },
  saveButton: {
    color: '#e94560',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  timePickerContainer: {
    backgroundColor: '#0f3460',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#e94560',
  },
  dayButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
  },
  snoozeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  snoozeOption: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  snoozeOptionActive: {
    backgroundColor: '#e94560',
  },
  snoozeOptionText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  snoozeOptionTextActive: {
    color: '#fff',
  },
});

export default AlarmDetailScreen;