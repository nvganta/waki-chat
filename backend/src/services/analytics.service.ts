import { journalService } from './journal.service';
import { goalsService } from './goals.service';
import { voiceJournalService } from './voiceJournal.service';
import { firestore } from '../config/firebase';

interface DashboardData {
  moodTrends: MoodTrend[];
  journalStats: JournalStats;
  goalProgress: GoalProgress;
  insights: Insight[];
  streaks: Streaks;
  recommendations: string[];
}

interface MoodTrend {
  date: string;
  mood: string;
  sentiment: number;
  entryCount: number;
}

interface JournalStats {
  totalEntries: number;
  thisWeek: number;
  thisMonth: number;
  averageLength: number;
  mostCommonMood: string;
  mostUsedTags: string[];
}

interface GoalProgress {
  activeGoals: number;
  completedThisMonth: number;
  overallProgress: number;
  upcomingDeadlines: Array<{ title: string; daysLeft: number }>;
}

interface Insight {
  type: 'mood' | 'productivity' | 'wellbeing' | 'achievement';
  title: string;
  description: string;
  icon: string;
}

interface Streaks {
  currentStreak: number;
  longestStreak: number;
  lastEntry: Date;
}

export class AnalyticsService {
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      const [moodTrends, journalStats, goalProgress, streaks] = await Promise.all([
        this.getMoodTrends(userId, 30),
        this.getJournalStats(userId),
        this.getGoalProgressSummary(userId),
        this.getStreaks(userId),
      ]);

      const insights = await this.generateInsights(userId, moodTrends, journalStats);
      const recommendations = await this.generateRecommendations(userId, insights);

      return {
        moodTrends,
        journalStats,
        goalProgress,
        streaks,
        insights,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  private async getMoodTrends(userId: string, days: number): Promise<MoodTrend[]> {
    try {
      const entries = await journalService.getEntries(userId, 100);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const trendMap = new Map<string, MoodTrend>();
      
      entries
        .filter(entry => new Date(entry.createdAt) > cutoffDate)
        .forEach(entry => {
          const dateKey = new Date(entry.createdAt).toISOString().split('T')[0];
          
          if (!trendMap.has(dateKey)) {
            trendMap.set(dateKey, {
              date: dateKey,
              mood: entry.mood || 'neutral',
              sentiment: entry.sentiment || 0,
              entryCount: 1,
            });
          } else {
            const existing = trendMap.get(dateKey)!;
            existing.sentiment = (existing.sentiment + (entry.sentiment || 0)) / 2;
            existing.entryCount++;
          }
        });

      return Array.from(trendMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
    } catch (error) {
      console.error('Error getting mood trends:', error);
      return [];
    }
  }

  private async getJournalStats(userId: string): Promise<JournalStats> {
    try {
      const entries = await journalService.getEntries(userId, 100);
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const thisWeek = entries.filter(e => new Date(e.createdAt) > weekAgo).length;
      const thisMonth = entries.filter(e => new Date(e.createdAt) > monthAgo).length;

      // Calculate average length
      const totalLength = entries.reduce((sum, e) => sum + e.content.length, 0);
      const averageLength = entries.length > 0 ? Math.round(totalLength / entries.length) : 0;

      // Find most common mood
      const moodCounts: { [key: string]: number } = {};
      entries.forEach(e => {
        if (e.mood) {
          moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        }
      });
      
      const mostCommonMood = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

      // Find most used tags
      const tagCounts: { [key: string]: number } = {};
      entries.forEach(e => {
        e.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const mostUsedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      return {
        totalEntries: entries.length,
        thisWeek,
        thisMonth,
        averageLength,
        mostCommonMood,
        mostUsedTags,
      };
    } catch (error) {
      console.error('Error getting journal stats:', error);
      return {
        totalEntries: 0,
        thisWeek: 0,
        thisMonth: 0,
        averageLength: 0,
        mostCommonMood: 'neutral',
        mostUsedTags: [],
      };
    }
  }

  private async getGoalProgressSummary(userId: string): Promise<GoalProgress> {
    try {
      const goals = await goalsService.getGoals(userId, true);
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeGoals = goals.filter(g => !g.isCompleted);
      const completedThisMonth = goals.filter(g => 
        g.isCompleted && new Date(g.createdAt) > monthAgo
      ).length;

      // Calculate overall progress
      const totalProgress = activeGoals.reduce((sum, g) => sum + g.progress, 0);
      const overallProgress = activeGoals.length > 0 
        ? Math.round(totalProgress / activeGoals.length) 
        : 0;

      // Get upcoming deadlines
      const upcomingDeadlines = activeGoals
        .filter(g => g.targetDate)
        .map(g => {
          const daysLeft = Math.ceil(
            (new Date(g.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return { title: g.title, daysLeft };
        })
        .filter(d => d.daysLeft > 0 && d.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3);

      return {
        activeGoals: activeGoals.length,
        completedThisMonth,
        overallProgress,
        upcomingDeadlines,
      };
    } catch (error) {
      console.error('Error getting goal progress:', error);
      return {
        activeGoals: 0,
        completedThisMonth: 0,
        overallProgress: 0,
        upcomingDeadlines: [],
      };
    }
  }

  private async getStreaks(userId: string): Promise<Streaks> {
    try {
      const entries = await journalService.getEntries(userId, 365);
      
      if (entries.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastEntry: new Date() };
      }

      // Sort entries by date
      entries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const lastEntry = new Date(entries[0].createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastEntry.setHours(0, 0, 0, 0);

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      for (const entry of entries) {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        
        if (entryDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (entryDate.getTime() < checkDate.getTime()) {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;
      
      for (const entry of entries) {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const dayDiff = Math.round(
            (prevDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (dayDiff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        
        prevDate = entryDate;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      return { currentStreak, longestStreak, lastEntry: entries[0].createdAt };
    } catch (error) {
      console.error('Error calculating streaks:', error);
      return { currentStreak: 0, longestStreak: 0, lastEntry: new Date() };
    }
  }

  private async generateInsights(
    userId: string, 
    moodTrends: MoodTrend[], 
    journalStats: JournalStats
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Mood insight
    if (moodTrends.length > 7) {
      const recentMoods = moodTrends.slice(-7);
      const avgSentiment = recentMoods.reduce((sum, t) => sum + t.sentiment, 0) / recentMoods.length;
      
      if (avgSentiment > 0.5) {
        insights.push({
          type: 'mood',
          title: 'Positive Momentum',
          description: 'Your mood has been consistently positive this week. Keep up the great energy!',
          icon: '🌟',
        });
      } else if (avgSentiment < -0.3) {
        insights.push({
          type: 'mood',
          title: 'Emotional Support',
          description: 'Your recent entries suggest you might be going through a tough time. Remember to be kind to yourself.',
          icon: '💙',
        });
      }
    }

    // Productivity insight
    if (journalStats.thisWeek >= 5) {
      insights.push({
        type: 'productivity',
        title: 'Consistent Journaling',
        description: `You've made ${journalStats.thisWeek} entries this week. Great consistency!`,
        icon: '📈',
      });
    }

    // Wellbeing insight
    if (journalStats.mostCommonMood === 'grateful' || journalStats.mostCommonMood === 'happy') {
      insights.push({
        type: 'wellbeing',
        title: 'Gratitude Practice',
        description: 'Your gratitude practice is showing positive results in your overall mood.',
        icon: '🙏',
      });
    }

    return insights;
  }

  private async generateRecommendations(userId: string, insights: Insight[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Based on insights, generate personalized recommendations
    if (insights.some(i => i.type === 'mood' && i.title.includes('Support'))) {
      recommendations.push('Try a 5-minute meditation before your next journal entry');
      recommendations.push('Consider reaching out to a friend or loved one today');
    }

    if (insights.some(i => i.type === 'productivity')) {
      recommendations.push('Challenge yourself to explore a new topic in tomorrow\'s entry');
      recommendations.push('Try voice journaling for a different perspective');
    }

    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push('Set a new goal to track your progress');
      recommendations.push('Review your past entries to see how far you\'ve come');
      recommendations.push('Try journaling at a different time of day');
    }

    return recommendations.slice(0, 3);
  }

  async exportAnalytics(userId: string, format: 'json' | 'csv'): Promise<string> {
    try {
      const data = await this.getDashboardData(userId);
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // Convert to CSV format
        const csv: string[] = ['Date,Mood,Sentiment,Entries'];
        data.moodTrends.forEach(trend => {
          csv.push(`${trend.date},${trend.mood},${trend.sentiment},${trend.entryCount}`);
        });
        return csv.join('\n');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics');
    }
  }
}

export const analyticsService = new AnalyticsService();