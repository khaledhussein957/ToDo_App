import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { tokenUtils } from "../../store/Api/baseQuery";
import {
  useGetAnalyticsDashboardQuery,
  useGetTaskAnalyticsQuery,
  useGetCategoryAnalyticsQuery,
  useGetProductivityInsightsQuery,
  AnalyticsQueryParams,
} from "../../store/Api/analyticsApi";
import SafeScreen from "../../components/SafeArea";

const { width } = Dimensions.get("window");

export default function AnalyticsTab() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [refreshing, setRefreshing] = useState(false);

  // Load user from storage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await tokenUtils.getUser();
        if (storedUser) {
          setUserFromStorage(storedUser);
          setCurrentUser(storedUser);
        } else {
          setCurrentUser(user);
        }
      } catch (error) {
        console.log("Error loading user from storage:", error);
        setCurrentUser(user);
      }
    };

    loadUserFromStorage();
  }, [user]);

  // Analytics queries
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useGetAnalyticsDashboardQuery();

  const {
    data: taskAnalytics,
    isLoading: isLoadingTaskAnalytics,
    refetch: refetchTaskAnalytics,
  } = useGetTaskAnalyticsQuery({ period: selectedPeriod });

  const {
    data: categoryAnalytics,
    isLoading: isLoadingCategoryAnalytics,
    refetch: refetchCategoryAnalytics,
  } = useGetCategoryAnalyticsQuery();

  const {
    data: productivityInsights,
    isLoading: isLoadingProductivity,
    refetch: refetchProductivity,
  } = useGetProductivityInsightsQuery({ period: selectedPeriod });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchTaskAnalytics(),
      refetchCategoryAnalytics(),
      refetchProductivity(),
    ]);
    setRefreshing(false);
  };

  // Period options
  const periodOptions = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
    { label: "1 Year", value: 365 },
  ];

  // Render period selector
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <Text style={styles.periodLabel}>Time Period:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.periodChip,
              selectedPeriod === option.value && styles.selectedPeriodChip,
            ]}
            onPress={() => setSelectedPeriod(option.value)}
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === option.value && styles.selectedPeriodChipText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render overview cards
  const renderOverviewCards = () => {
    if (!dashboardData?.overview) return null;

    const { overview } = dashboardData;
    const cards = [
      {
        title: "Total Tasks",
        value: overview.totalTasks,
        icon: "list",
        color: "#8B593E",
      },
      {
        title: "Completed",
        value: overview.completedTasks,
        icon: "checkmark-circle",
        color: "#10B981",
      },
      {
        title: "Pending",
        value: overview.pendingTasks,
        icon: "time",
        color: "#F59E0B",
      },
      {
        title: "Overdue",
        value: overview.overdueTasks,
        icon: "warning",
        color: "#EF4444",
      },
    ];

    return (
      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <View key={index} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
                <Ionicons name={card.icon as any} size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render completion rate
  const renderCompletionRate = () => {
    if (!dashboardData?.overview) return null;

    const { completionRate, averageTasksPerDay } = dashboardData.overview;

    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{completionRate.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{averageTasksPerDay.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Tasks/Day</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render category distribution
  const renderCategoryDistribution = () => {
    if (!dashboardData?.categoryDistribution || dashboardData.categoryDistribution.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Distribution</Text>
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No categories with tasks yet</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Distribution</Text>
        <View style={styles.categoryList}>
          {dashboardData.categoryDistribution.slice(0, 5).map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category._id}</Text>
                <Text style={styles.categoryCount}>{category.count} tasks</Text>
              </View>
              <View style={styles.categoryStats}>
                <Text style={styles.completedCount}>{category.completed} completed</Text>
                <Text style={styles.pendingCount}>{category.pending} pending</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render priority distribution
  const renderPriorityDistribution = () => {
    if (!dashboardData?.priorityDistribution || dashboardData.priorityDistribution.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Distribution</Text>
        <View style={styles.priorityList}>
          {dashboardData.priorityDistribution.map((priority, index) => (
            <View key={index} style={styles.priorityItem}>
              <View style={styles.priorityInfo}>
                <Text style={styles.priorityName}>
                  {priority._id.charAt(0).toUpperCase() + priority._id.slice(1)}
                </Text>
                <Text style={styles.priorityCount}>{priority.count} tasks</Text>
              </View>
              <View style={styles.priorityProgress}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(priority.completed / priority.count) * 100}%`,
                      backgroundColor: getPriorityColor(priority._id),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render productivity insights
  const renderProductivityInsights = () => {
    if (!productivityInsights) return null;

    const { streaks, bestDays } = productivityInsights;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productivity Insights</Text>
        
        {/* Streaks */}
        {streaks && (
          <View style={styles.streaksContainer}>
            <View style={styles.streakCard}>
              <Ionicons name="flame" size={24} color="#EF4444" />
              <Text style={styles.streakValue}>{streaks.currentStreak || 0}</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text style={styles.streakValue}>{streaks.maxStreak || 0}</Text>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
          </View>
        )}

        {/* Best Days */}
        {bestDays && bestDays.length > 0 && (
          <View style={styles.bestDaysContainer}>
            <Text style={styles.subsectionTitle}>Best Performing Days</Text>
            <View style={styles.bestDaysList}>
              {bestDays.slice(0, 3).map((day: any, index: number) => (
                <View key={index} style={styles.bestDayItem}>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                  <Text style={styles.dayScore}>
                    {day.productivityScore.toFixed(1)}% productivity
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render recent activity
  const renderRecentActivity = () => {
    if (!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={activity.completed ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={activity.completed ? "#10B981" : "#6B7280"}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>
                  {activity.categoryName && `${activity.categoryName} • `}
                  {new Date(activity.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  // Loading state
  if (isLoadingDashboard) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B593E" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Track your productivity and progress
          </Text>
        </View>

        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* Completion Rate */}
        {renderCompletionRate()}

        {/* Category Distribution */}
        {renderCategoryDistribution()}

        {/* Priority Distribution */}
        {renderPriorityDistribution()}

        {/* Productivity Insights */}
        {renderProductivityInsights()}

        {/* Recent Activity */}
        {renderRecentActivity()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  periodSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  periodChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedPeriodChip: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
  },
  periodChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedPeriodChipText: {
    color: "#FFFFFF",
  },
  overviewContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8B593E",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  categoryStats: {
    alignItems: "flex-end",
  },
  completedCount: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  pendingCount: {
    fontSize: 14,
    color: "#F59E0B",
    fontWeight: "500",
  },
  priorityList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityItem: {
    marginBottom: 16,
  },
  priorityInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priorityName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  priorityCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  priorityProgress: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  streaksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  streakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  bestDaysContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  bestDaysList: {
    gap: 8,
  },
  bestDayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  dayScore: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  activityList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  bottomSpacing: {
    height: 20,
  },
});
