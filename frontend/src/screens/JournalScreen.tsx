import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  tags: string[];
  createdAt: string;
  sentiment: number;
}

const moodEmojis: { [key: string]: string } = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  excited: '🎉',
  calm: '😌',
  frustrated: '😤',
  grateful: '🙏',
  neutral: '😐',
};

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/journal/entries?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      } else {
        Alert.alert('Error', 'Failed to fetch journal entries');
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const searchEntries = async () => {
    if (!searchQuery.trim()) {
      fetchEntries();
      return;
    }

    setIsSearching(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/api/journal/search?query=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      } else {
        Alert.alert('Error', 'Search failed');
      }
    } catch (error) {
      console.error('Error searching entries:', error);
      Alert.alert('Error', 'Failed to search entries');
    } finally {
      setIsSearching(false);
    }
  };

  const createEntry = async () => {
    if (!newEntry.trim()) {
      Alert.alert('Error', 'Please write something in your journal');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/journal/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newEntry,
        }),
      });

      if (response.ok) {
        setNewEntry('');
        fetchEntries();
        Alert.alert('Success', 'Journal entry created!');
      } else {
        Alert.alert('Error', 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEntry = async (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${API_URL}/api/journal/entries/${id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                fetchEntries();
              } else {
                Alert.alert('Error', 'Failed to delete entry');
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const date = new Date(item.createdAt);
    const moodEmoji = moodEmojis[item.mood] || moodEmojis.neutral;

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onLongPress={() => deleteEntry(item.id)}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <Text style={styles.entryDate}>
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.entryContent} numberOfLines={3}>
          {item.content}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.sentimentBar}>
          <View
            style={[
              styles.sentimentFill,
              {
                width: `${((item.sentiment + 1) / 2) * 100}%`,
                backgroundColor: item.sentiment > 0 ? '#4CAF50' : item.sentiment < 0 ? '#F44336' : '#9E9E9E',
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Journal</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search journal entries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchEntries}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchEntries}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.newEntryContainer}>
        <TextInput
          style={styles.newEntryInput}
          placeholder="What's on your mind today?"
          value={newEntry}
          onChangeText={setNewEntry}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={createEntry}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Entry</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={fetchEntries}
        />
      )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#6200EA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  newEntryContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    maxHeight: 200,
  },
  newEntryInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#6200EA',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moodEmoji: {
    fontSize: 24,
  },
  entryDate: {
    fontSize: 12,
    color: '#757575',
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#6200EA',
  },
  sentimentBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});