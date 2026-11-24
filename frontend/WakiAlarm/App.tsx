import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Button, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  MissingAccess,
  accessExplanation,
  cancelDeviceAlarm,
  openAccessSettings,
  readAlarmAccess,
  requestAlarmAccess,
  restoreDeviceAlarms,
  scheduleDeviceAlarm,
  scheduledAlarms,
} from './src/services/deviceAlarms';

const ID = 'local-wake-up';

function clockTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function App() {
  const [time, setTime] = useState(new Date());
  const [picker, setPicker] = useState(false);
  const [next, setNext] = useState(0);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<MissingAccess | null>(null);

  const refresh = useCallback(async () => {
    setMissing(await readAlarmAccess());
    const alarms = await scheduledAlarms();
    const alarm = alarms.find(item => item.id === ID);
    setNext(alarm?.snoozeAt || alarm?.nextAt || 0);
    if (alarm) {
      const [hour, minute] = alarm.time.split(':').map(Number);
      const value = new Date();
      value.setHours(hour, minute, 0, 0);
      setTime(value);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await restoreDeviceAlarms();
      await refresh();
    };
    load().catch(() => Alert.alert('Alarm unavailable', 'Could not read this device’s alarm.'));
    // Coming back from Android settings is the moment a permission may have changed.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') load().catch(() => {});
    });
    return () => subscription.remove();
  }, [refresh]);

  const save = async () => {
    setBusy(true);
    try {
      const blocked = await requestAlarmAccess();
      setMissing(blocked);
      if (blocked) return;
      await scheduleDeviceAlarm({
        id: ID,
        userId: 'local',
        time: clockTime(time),
        days: [],
        enabled: true,
        label: 'Wake up',
        snoozeEnabled: true,
        snoozeDuration: 10,
      });
      await refresh();
    } catch (error) {
      Alert.alert(
        'Alarm not scheduled',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await cancelDeviceAlarm(ID);
      await refresh();
    } catch {
      Alert.alert('Could not cancel', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>WAKI · ANDROID PROTOTYPE</Text>
        <Text style={styles.title}>Wake up with a voice.</Text>
        <Text style={styles.copy}>
          Set one alarm on this phone. Waki rings, speaks a short greeting, and lets you stop or
          snooze for 10 minutes.
        </Text>
        {missing && (
          <View style={styles.warning} accessibilityRole="alert">
            <Text style={styles.warningText}>{accessExplanation[missing]}</Text>
            <Button title="Open settings" onPress={() => openAccessSettings(missing)} />
          </View>
        )}
        <Text style={styles.label}>WAKE-UP TIME</Text>
        <Text style={styles.time}>
          {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
        <Button title="Choose time" onPress={() => setPicker(true)} disabled={busy} />
        {picker && (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={(_, selected) => {
              setPicker(false);
              if (selected) setTime(selected);
            }}
          />
        )}
        <View style={styles.action}>
          <Button title={busy ? 'Saving…' : 'Set alarm'} onPress={save} disabled={busy} />
        </View>
        <Text style={styles.status}>
          {next > 0
            ? `Scheduled for ${new Date(next).toLocaleString()}`
            : 'No alarm scheduled yet.'}
        </Text>
        {next > 0 && <Button title="Cancel alarm" onPress={cancel} disabled={busy} />}
        <Text style={styles.note}>
          Waki only asks for what the alarm needs: alarms at an exact time, and notifications so
          Stop and Snooze appear on your lock screen. The microphone is asked for only if you tap
          Speak while it rings. Keep a backup alarm until you have tested Waki on your phone.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#171a2d' },
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  eyebrow: { color: '#ffb99b', fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  title: { color: 'white', fontSize: 34, fontWeight: '700', marginTop: 12 },
  copy: { color: '#d6d8e4', fontSize: 16, lineHeight: 24, marginTop: 12 },
  warning: { backgroundColor: '#3a2a20', borderRadius: 10, padding: 14, marginTop: 20, gap: 10 },
  warningText: { color: '#ffd9c7', fontSize: 15, lineHeight: 21 },
  label: { color: '#b4b9cc', marginTop: 30, letterSpacing: 1 },
  time: { color: 'white', fontSize: 42, marginVertical: 12 },
  action: { marginTop: 14 },
  status: { color: 'white', marginVertical: 18, fontSize: 16 },
  note: { color: '#b4b9cc', marginTop: 24, lineHeight: 20 },
});
