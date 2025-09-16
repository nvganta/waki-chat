import { firestore } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'health' | 'career' | 'personal' | 'learning' | 'financial' | 'relationship';
  targetDate: Date;
  createdAt: Date;
  progress: number; // 0-100
  milestones: Milestone[];
  isCompleted: boolean;
  reminderTime?: string; // HH:mm format
  linkedJournalEntries: string[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export class GoalsService {
  private collection = firestore.collection('goals');

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<string> {
    try {
      const goalId = uuidv4();
      const newGoal: Goal = {
        ...goal,
        id: goalId,
        createdAt: new Date(),
        progress: 0,
        isCompleted: false,
        milestones: goal.milestones || [],
        linkedJournalEntries: [],
      };

      await this.collection.doc(goalId).set(newGoal);
      return goalId;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw new Error('Failed to create goal');
    }
  }

  async getGoals(userId: string, includeCompleted: boolean = false): Promise<Goal[]> {
    try {
      let query = this.collection.where('userId', '==', userId);
      
      if (!includeCompleted) {
        query = query.where('isCompleted', '==', false);
      }
      
      const snapshot = await query.get();
      const goals: Goal[] = [];
      
      snapshot.forEach(doc => {
        goals.push(doc.data() as Goal);
      });
      
      return goals.sort((a, b) => 
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      );
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw new Error('Failed to fetch goals');
    }
  }

  async updateGoalProgress(
    userId: string, 
    goalId: string, 
    progress: number,
    milestoneId?: string
  ): Promise<void> {
    try {
      const goalRef = this.collection.doc(goalId);
      const goalDoc = await goalRef.get();
      
      if (!goalDoc.exists) {
        throw new Error('Goal not found');
      }
      
      const goal = goalDoc.data() as Goal;
      
      if (goal.userId !== userId) {
        throw new Error('Unauthorized to update this goal');
      }
      
      const updates: Partial<Goal> = {
        progress: Math.min(100, Math.max(0, progress)),
      };
      
      // Update milestone if provided
      if (milestoneId && goal.milestones) {
        updates.milestones = goal.milestones.map(m => 
          m.id === milestoneId 
            ? { ...m, completed: true, completedAt: new Date() }
            : m
        );
        
        // Recalculate progress based on milestones
        const completedMilestones = updates.milestones.filter(m => m.completed).length;
        updates.progress = Math.round((completedMilestones / updates.milestones.length) * 100);
      }
      
      // Mark as completed if progress is 100
      if (updates.progress === 100) {
        updates.isCompleted = true;
      }
      
      await goalRef.update(updates);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw new Error('Failed to update goal progress');
    }
  }

  async linkJournalEntry(userId: string, goalId: string, journalEntryId: string): Promise<void> {
    try {
      const goalRef = this.collection.doc(goalId);
      const goalDoc = await goalRef.get();
      
      if (!goalDoc.exists) {
        throw new Error('Goal not found');
      }
      
      const goal = goalDoc.data() as Goal;
      
      if (goal.userId !== userId) {
        throw new Error('Unauthorized to update this goal');
      }
      
      if (!goal.linkedJournalEntries.includes(journalEntryId)) {
        await goalRef.update({
          linkedJournalEntries: [...goal.linkedJournalEntries, journalEntryId],
        });
      }
    } catch (error) {
      console.error('Error linking journal entry:', error);
      throw new Error('Failed to link journal entry');
    }
  }

  async getGoalSuggestions(userId: string, recentJournalContent: string): Promise<string[]> {
    try {
      const { getFriendliCompletion } = require('./friendli.service');
      
      const prompt = `Based on this journal content, suggest 3 SMART goals that would benefit this person.
      Make them specific, measurable, achievable, relevant, and time-bound.
      
      Journal content: "${recentJournalContent}"
      
      Respond with just 3 goals, one per line, no numbering or bullets.`;
      
      const response = await getFriendliCompletion(prompt);
      const suggestions = response.split('\n').filter(s => s.trim()).slice(0, 3);
      
      return suggestions;
    } catch (error) {
      console.error('Error generating goal suggestions:', error);
      return [
        'Start a daily 10-minute meditation practice for the next 30 days',
        'Complete one creative project by the end of the month',
        'Reach out to one friend or family member each week',
      ];
    }
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    try {
      const goalRef = this.collection.doc(goalId);
      const goalDoc = await goalRef.get();
      
      if (!goalDoc.exists) {
        throw new Error('Goal not found');
      }
      
      const goal = goalDoc.data() as Goal;
      
      if (goal.userId !== userId) {
        throw new Error('Unauthorized to delete this goal');
      }
      
      await goalRef.delete();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw new Error('Failed to delete goal');
    }
  }

  async getGoalProgress(userId: string): Promise<{
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    completionRate: number;
    categoriesBreakdown: { [key: string]: number };
  }> {
    try {
      const allGoals = await this.getGoals(userId, true);
      const completed = allGoals.filter(g => g.isCompleted);
      const inProgress = allGoals.filter(g => !g.isCompleted);
      
      const categoriesBreakdown: { [key: string]: number } = {};
      allGoals.forEach(goal => {
        categoriesBreakdown[goal.category] = (categoriesBreakdown[goal.category] || 0) + 1;
      });
      
      return {
        totalGoals: allGoals.length,
        completedGoals: completed.length,
        inProgressGoals: inProgress.length,
        completionRate: allGoals.length > 0 
          ? Math.round((completed.length / allGoals.length) * 100) 
          : 0,
        categoriesBreakdown,
      };
    } catch (error) {
      console.error('Error getting goal progress:', error);
      throw new Error('Failed to get goal progress');
    }
  }
}

export const goalsService = new GoalsService();