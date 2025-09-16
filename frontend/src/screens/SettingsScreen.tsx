import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { preferencesAPI, aiAPI } from '../services/api';
import { firebaseAuth } from '../services/firebase';
import { UserPreferences } from '../types';

const SettingsScreen = ({ navigation }: any) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    userId: '',
    name: '',
    location: { city: '', country: '' },
    voiceStyle: 'friendly',
    includeWeather: true,
    includeNews: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await preferencesAPI.getPreferences();
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await preferencesAPI.updatePreferences(preferences);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlarm = async () => {
    setTesting(true);
    try {
      const response = await aiAPI.testAlarm();
      Alert.alert('Test Alarm', response.data.message);
    } catch (error) {
      Alert.alert('Error', 'Failed to test alarm');
    } finally {
      setTesting(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseAuth.signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const voiceStyles = [
    { value: 'friendly', label: 'Friendly' },
    { value: 'professional', label: 'Professional' },
    { value: 'energetic', label: 'Energetic' },
    { value: 'calm', label: 'Calm' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={preferences.name}
            onChangeText={(text) => setPreferences({ ...preferences, name: text })}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={preferences.location.city}
            onChangeText={(text) =>
              setPreferences({
                ...preferences,
                location: { ...preferences.location, city: text },
              })
            }
            placeholder="Enter your city"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Country Code</Text>
          <TextInput
            style={styles.input}
            value={preferences.location.country}
            onChangeText={(text) =>
              setPreferences({
                ...preferences,
                location: { ...preferences.location, country: text },
              })
            }
            placeholder="e.g., US, GB, FR"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Style</Text>
          <View style={styles.voiceStyles}>
            {voiceStyles.map((style) => (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.voiceStyleButton,
                  preferences.voiceStyle === style.value && styles.voiceStyleActive,
                ]}
                onPress={() =>
                  setPreferences({ ...preferences, voiceStyle: style.value as any })
                }
              >
                <Text
                  style={[
                    styles.voiceStyleText,
                    preferences.voiceStyle === style.value && styles.voiceStyleTextActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestAlarm}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Testing...' : 'Test Alarm'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  voiceStyles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  voiceStyleButton: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  voiceStyleActive: {
    backgroundColor: '#e94560',
  },
  voiceStyleText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceStyleTextActive: {
    color: '#fff',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: '#e94560',
  },
  testButton: {
    backgroundColor: '#16537e',
  },
  signOutButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;