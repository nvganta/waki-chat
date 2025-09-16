import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

interface DashboardData {
  moodTrends: Array<{
    date: string;
    mood: string;
    sentiment: number;
    entryCount: number;
  }>;
  journalStats: {
    totalEntries: number;
    thisWeek: number;
    thisMonth: number;
    averageLength: number;
    mostCommonMood: string;
    mostUsedTags: string[];
  };
  goalProgress: {
    activeGoals: number;
    completedThisMonth: number;
    overallProgress: number;
    upcomingDeadlines: Array<{ title: string; daysLeft: number }>;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
  }>;
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastEntry: string;
  };
  recommendations: string[];
}

export default function AnalyticsScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/analytics/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        Alert.alert('Error', 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/analytics/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', `Analytics exported as ${format.toUpperCase()}`);
      } else {
        Alert.alert('Error', 'Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export analytics');
    }
  };

  const renderMoodChart = () => {
    if (!dashboardData?.moodTrends.length) return null;

    const maxSentiment = Math.max(...dashboardData.moodTrends.map(t => t.sentiment));
    const minSentiment = Math.min(...dashboardData.moodTrends.map(t => t.sentiment));
    const range = maxSentiment - minSentiment || 1;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Mood Trends</Text>
        <View style={styles.chart}>
          {dashboardData.moodTrends.slice(-7).map((trend, index) => {
            const height = ((trend.sentiment - minSentiment) / range) * 100 + 20;
            const color = trend.sentiment > 0 ? '#4CAF50' : trend.sentiment < 0 ? '#F44336' : '#9E9E9E';
            
            return (
              <View key={index} style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: `${height}%`,
                      backgroundColor: color,
                    },
                  ]} 
                />
                <Text style={styles.barLabel}>
                  {new Date(trend.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EA" />
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => exportData('csv')}
          >
            <Text style={styles.exportButtonText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => exportData('json')}
          >
            <Text style={styles.exportButtonText}>JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Streaks Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journal Streaks 🔥</Text>
        <View style={styles.streaksContainer}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{dashboardData.streaks.currentStreak}</Text>
            <Text style={styles.streakLabel}>Current</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{dashboardData.streaks.longestStreak}</Text>
            <Text style={styles.streakLabel}>Longest</Text>
          </View>
        </View>
      </View>

      {/* Journal Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journal Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboardData.journalStats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboardData.journalStats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboardData.journalStats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboardData.journalStats.averageLength}</Text>
            <Text style={styles.statLabel}>Avg. Length</Text>
          </View>
        </View>
        <View style={styles.moodInfo}>
          <Text style={styles.moodLabel}>Most Common Mood:</Text>
          <Text style={styles.moodValue}>{dashboardData.journalStats.mostCommonMood}</Text>
        </View>
      </View>

      {/* Mood Chart */}
      {renderMoodChart()}

      {/* Goals Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Goals Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${dashboardData.goalProgress.overallProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {dashboardData.goalProgress.overallProgress}% Complete
          </Text>
        </View>
        <View style={styles.goalsStats}>
          <Text style={styles.goalStat}>
            Active: {dashboardData.goalProgress.activeGoals}
          </Text>
          <Text style={styles.goalStat}>
            Completed: {dashboardData.goalProgress.completedThisMonth}
          </Text>
        </View>
        {dashboardData.goalProgress.upcomingDeadlines.length > 0 && (
          <View style={styles.deadlines}>
            <Text style={styles.deadlineTitle}>Upcoming Deadlines:</Text>
            {dashboardData.goalProgress.upcomingDeadlines.map((deadline, index) => (
              <Text key={index} style={styles.deadlineItem}>
                • {deadline.title} ({deadline.daysLeft} days)
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Insights */}
      {dashboardData.insights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insights</Text>
          {dashboardData.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDesc}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {dashboardData.recommendations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommendations</Text>
          {dashboardData.recommendations.map((rec, index) => (
            <Text key={index} style={styles.recommendation}>
              💡 {rec}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 15,
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  streakLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 5,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EA',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  moodLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 10,
  },
  moodValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    textTransform: 'capitalize',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    color: '#757575',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  goalsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  goalStat: {
    fontSize: 14,
    color: '#757575',
  },
  deadlines: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  deadlineItem: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 18,
  },
  recommendation: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 22,
    marginBottom: 8,
  },
});