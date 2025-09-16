import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '../config';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  isCompleted: boolean;
}

const categories = [
  { value: 'health', label: 'Health & Fitness', emoji: '💪' },
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'personal', label: 'Personal Growth', emoji: '🌱' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
  { value: 'financial', label: 'Financial', emoji: '💰' },
  { value: 'relationship', label: 'Relationships', emoji: '❤️' },
];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    milestones: [] as string[],
  });
  const [currentMilestone, setCurrentMilestone] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/goals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        Alert.alert('Error', 'Failed to fetch goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async () => {
    if (!newGoal.title) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newGoal,
          milestones: newGoal.milestones.map((title, index) => ({
            id: `m${index}`,
            title,
            completed: false,
          })),
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetNewGoal();
        fetchGoals();
        Alert.alert('Success', 'Goal created successfully!');
      } else {
        Alert.alert('Error', 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const updateProgress = async (goalId: string, newProgress: number, milestoneId?: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress: newProgress,
          milestoneId,
        }),
      });

      if (response.ok) {
        fetchGoals();
      } else {
        Alert.alert('Error', 'Failed to update goal progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const deleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${API_URL}/api/goals/${goalId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                fetchGoals();
              } else {
                Alert.alert('Error', 'Failed to delete goal');
              }
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const resetNewGoal = () => {
    setNewGoal({
      title: '',
      description: '',
      category: 'personal',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      milestones: [],
    });
    setCurrentMilestone('');
  };

  const addMilestone = () => {
    if (currentMilestone.trim()) {
      setNewGoal({
        ...newGoal,
        milestones: [...newGoal.milestones, currentMilestone.trim()],
      });
      setCurrentMilestone('');
    }
  };

  const removeMilestone = (index: number) => {
    setNewGoal({
      ...newGoal,
      milestones: newGoal.milestones.filter((_, i) => i !== index),
    });
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const category = categories.find(c => c.value === item.category);
    const daysLeft = Math.ceil(
      (new Date(item.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={[styles.goalCard, item.isCompleted && styles.completedGoal]}
        onLongPress={() => deleteGoal(item.id)}
      >
        <View style={styles.goalHeader}>
          <Text style={styles.categoryEmoji}>{category?.emoji}</Text>
          <Text style={styles.goalTitle}>{item.title}</Text>
        </View>

        {item.description ? (
          <Text style={styles.goalDescription}>{item.description}</Text>
        ) : null}

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.progress}%` },
                item.isCompleted && styles.completedProgress,
              ]}
            />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>

        {item.milestones && item.milestones.length > 0 && (
          <View style={styles.milestonesContainer}>
            <Text style={styles.milestonesTitle}>Milestones:</Text>
            {item.milestones.map((milestone) => (
              <TouchableOpacity
                key={milestone.id}
                style={styles.milestoneItem}
                onPress={() => {
                  if (!milestone.completed) {
                    updateProgress(item.id, 0, milestone.id);
                  }
                }}
              >
                <Text style={[
                  styles.milestoneCheckbox,
                  milestone.completed && styles.milestoneCompleted,
                ]}>
                  {milestone.completed ? '✅' : '⬜'}
                </Text>
                <Text style={[
                  styles.milestoneText,
                  milestone.completed && styles.milestoneTextCompleted,
                ]}>
                  {milestone.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.goalFooter}>
          <Text style={styles.categoryLabel}>{category?.label}</Text>
          {!item.isCompleted && daysLeft > 0 && (
            <Text style={styles.daysLeft}>{daysLeft} days left</Text>
          )}
          {item.isCompleted && (
            <Text style={styles.completedLabel}>Completed! 🎉</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>
                Tap "New Goal" to create your first goal
              </Text>
            </View>
          }
        />
      )}

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={styles.input}
                placeholder="Goal Title"
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryOption,
                        newGoal.category === cat.value && styles.categorySelected,
                      ]}
                      onPress={() => setNewGoal({ ...newGoal, category: cat.value })}
                    >
                      <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryOptionText}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Target Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {newGoal.targetDate.toDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newGoal.targetDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setNewGoal({ ...newGoal, targetDate: date });
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Milestones</Text>
              <View style={styles.milestoneInput}>
                <TextInput
                  style={styles.milestoneTextInput}
                  placeholder="Add a milestone"
                  value={currentMilestone}
                  onChangeText={setCurrentMilestone}
                />
                <TouchableOpacity
                  style={styles.milestoneAddButton}
                  onPress={addMilestone}
                >
                  <Text style={styles.milestoneAddText}>Add</Text>
                </TouchableOpacity>
              </View>

              {newGoal.milestones.map((milestone, index) => (
                <View key={index} style={styles.milestonePreview}>
                  <Text style={styles.milestonePreviewText}>• {milestone}</Text>
                  <TouchableOpacity onPress={() => removeMilestone(index)}>
                    <Text style={styles.milestoneRemove}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetNewGoal();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={createGoal}
              >
                <Text style={styles.createButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  goalCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedGoal: {
    opacity: 0.8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  goalDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200EA',
    borderRadius: 4,
  },
  completedProgress: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6200EA',
  },
  milestonesContainer: {
    marginBottom: 15,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneCheckbox: {
    fontSize: 16,
    marginRight: 8,
  },
  milestoneCompleted: {
    color: '#4CAF50',
  },
  milestoneText: {
    fontSize: 14,
    color: '#212121',
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  daysLeft: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  completedLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  categoryOption: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categorySelected: {
    backgroundColor: '#E8EAF6',
    borderColor: '#6200EA',
  },
  categoryOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryOptionText: {
    fontSize: 10,
    color: '#757575',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#212121',
  },
  milestoneInput: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  milestoneTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  milestoneAddButton: {
    backgroundColor: '#6200EA',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  milestoneAddText: {
    color: '#FFF',
    fontWeight: '600',
  },
  milestonePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  milestonePreviewText: {
    fontSize: 14,
    color: '#757575',
  },
  milestoneRemove: {
    fontSize: 24,
    color: '#F44336',
    paddingHorizontal: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#757575',
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#6200EA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});