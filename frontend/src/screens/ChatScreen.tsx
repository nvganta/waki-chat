import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

interface VapiCallData {
  assistantId: string;
  webCallUrl: string;
}

export default function ChatScreen() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callData, setCallData] = useState<VapiCallData | null>(null);
  const [userName, setUserName] = useState('Friend');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setUserName(profile.displayName || 'Friend');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const startVoiceCall = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const location = await AsyncStorage.getItem('userLocation');

      const response = await fetch(`${API_URL}/api/vapi/web-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userName,
          location: location || 'San Francisco',
          alarmTime: new Date().toLocaleTimeString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCallData(data);
        setIsCallActive(true);
        
        // On web, we would embed Vapi's web SDK here
        // For mobile, we'd use WebRTC integration
        Alert.alert(
          'Voice Call Started',
          'Your morning companion is ready to chat with you!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to start voice call');
      }
    } catch (error) {
      console.error('Error starting voice call:', error);
      Alert.alert('Error', 'Failed to connect to voice service');
    } finally {
      setIsLoading(false);
    }
  };

  const endVoiceCall = async () => {
    if (!callData) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/api/vapi/end/${callData.assistantId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIsCallActive(false);
      setCallData(null);
      
      Alert.alert(
        'Call Ended',
        'Would you like to save this conversation to your journal?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: saveToJournal },
        ]
      );
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const saveToJournal = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Get transcript from Vapi
      if (callData) {
        const transcriptResponse = await fetch(
          `${API_URL}/api/vapi/transcript/${callData.assistantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (transcriptResponse.ok) {
          const { transcript } = await transcriptResponse.json();
          
          // Save to journal
          await fetch(`${API_URL}/api/journal/entries`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content: `Morning conversation: ${transcript}`,
              mood: 'conversational',
              tags: ['morning-chat', 'vapi'],
            }),
          });

          Alert.alert('Success', 'Conversation saved to your journal!');
        }
      }
    } catch (error) {
      console.error('Error saving to journal:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Waki Chat</Text>
        <Text style={styles.subtitle}>Your AI Morning Companion</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.greeting}>Good morning, {userName}!</Text>
          <Text style={styles.statusText}>
            {isCallActive
              ? 'Voice assistant is active'
              : 'Ready to start your morning conversation'}
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>🎙️</Text>
            <Text style={styles.featureTitle}>Natural Voice</Text>
            <Text style={styles.featureDesc}>
              Have real conversations with your AI companion
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>☀️</Text>
            <Text style={styles.featureTitle}>Morning Motivation</Text>
            <Text style={styles.featureDesc}>
              Get personalized encouragement for your day
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>📝</Text>
            <Text style={styles.featureTitle}>Auto Journal</Text>
            <Text style={styles.featureDesc}>
              Save conversations to your journal automatically
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.callButton,
            isCallActive ? styles.endCallButton : styles.startCallButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={isCallActive ? endVoiceCall : startVoiceCall}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="large" />
          ) : (
            <>
              <Text style={styles.callButtonEmoji}>
                {isCallActive ? '📵' : '📞'}
              </Text>
              <Text style={styles.callButtonText}>
                {isCallActive ? 'End Conversation' : 'Start Morning Chat'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isCallActive && (
          <View style={styles.callInfo}>
            <View style={styles.pulseIndicator} />
            <Text style={styles.callInfoText}>Voice call in progress...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#6200EA',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#E8EAF6',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#757575',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  featureDesc: {
    fontSize: 12,
    color: '#757575',
    flex: 2,
  },
  callButton: {
    paddingVertical: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  startCallButton: {
    backgroundColor: '#4CAF50',
  },
  endCallButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  callButtonEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  callInfoText: {
    fontSize: 14,
    color: '#757575',
  },
});