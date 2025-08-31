import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { tokenUtils } from "../../store/Api/baseQuery";
import {
  useGetUserNotificationsQuery,
  useGetNotificationStatsQuery,
  useDeleteNotificationMutation,
  useMarkNotificationAsSentMutation,
  useBulkDeleteNotificationsMutation,
  useInitializeNotificationsMutation,
  useRequestNotificationPermissionsMutation,
  useCheckNotificationPermissionsQuery,
  useGenerateTaskNotificationsMutation,
  Notification,
  NotificationQueryParams,
} from "../../store/Api/notificationApi";
import SafeScreen from "../../components/SafeArea";

export default function NotificationsTab() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'sent' | 'pending'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
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

  // Notification queries
  const queryParams: NotificationQueryParams = {
    page: 1,
    limit: 20,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  };

  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useGetUserNotificationsQuery(queryParams);

  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useGetNotificationStatsQuery();

  // Notification mutations
  const [deleteNotification] = useDeleteNotificationMutation();
  const [markAsSent] = useMarkNotificationAsSentMutation();
  const [bulkDelete] = useBulkDeleteNotificationsMutation();
  const [initializeNotifications] = useInitializeNotificationsMutation();
  const [requestPermissions] = useRequestNotificationPermissionsMutation();
  const [generateTaskNotifications] = useGenerateTaskNotificationsMutation();

  // Check notification permissions
  const { data: permissionsEnabled } = useCheckNotificationPermissionsQuery();

  // Initialize notifications on mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await initializeNotifications().unwrap();
      } catch (error) {
        console.log("Failed to initialize notifications:", error);
      }
    };

    initNotifications();
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchNotifications(),
        refetchStats(),
      ]);
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle generate task notifications
  const handleGenerateTaskNotifications = async () => {
    try {
      const result = await generateTaskNotifications().unwrap();
      Alert.alert(
        "Success",
        result.message,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to generate task notifications");
    }
  };

  // Handle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedNotifications.length === 0) return;

    Alert.alert(
      "Delete Notifications",
      `Are you sure you want to delete ${selectedNotifications.length} notification(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await bulkDelete(selectedNotifications).unwrap();
              setSelectedNotifications([]);
              setIsSelectionMode(false);
            } catch (error) {
              Alert.alert("Error", "Failed to delete notifications");
            }
          },
        },
      ]
    );
  };

  // Handle single notification delete
  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNotification(notificationId).unwrap();
            } catch (error) {
              Alert.alert("Error", "Failed to delete notification");
            }
          },
        },
      ]
    );
  };

  // Handle mark as sent
  const handleMarkAsSent = async (notificationId: string) => {
    try {
      await markAsSent(notificationId).unwrap();
    } catch (error) {
      Alert.alert("Error", "Failed to mark notification as sent");
    }
  };

  // Request notification permissions
  const handleRequestPermissions = async () => {
    try {
      await requestPermissions().unwrap();
    } catch (error) {
      Alert.alert("Error", "Failed to request notification permissions");
    }
  };

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#EF4444" />
      <Text style={styles.errorTitle}>Unable to load notifications</Text>
      <Text style={styles.errorText}>
        {notificationsError || statsError ? 
          "There was an error connecting to the server. Please check your connection and try again." :
          "Something went wrong. Please try refreshing."
        }
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      {isSelectionMode && (
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleNotificationSelection(item._id)}
        >
          <Ionicons
            name={selectedNotifications.includes(item._id) ? "checkbox" : "square-outline"}
            size={20}
            color="#8B593E"
          />
        </TouchableOpacity>
      )}
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <View style={styles.notificationStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: item.sent ? "#10B981" : "#F59E0B" }
            ]} />
            <Text style={styles.statusText}>
              {item.sent ? "Sent" : "Pending"}
            </Text>
          </View>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        {item.taskId_details && (
          <View style={styles.taskInfo}>
            <Ionicons name="list" size={16} color="#6B7280" />
            <Text style={styles.taskTitle}>{item.taskId_details.title}</Text>
          </View>
        )}
        
        <View style={styles.notificationMeta}>
          <Text style={styles.notificationDate}>
            {new Date(item.notifyAt).toLocaleDateString()} at {new Date(item.notifyAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>
      
      {!isSelectionMode && (
        <View style={styles.notificationActions}>
          {!item.sent && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkAsSent(item._id)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteNotification(item._id)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render stats cards
  const renderStatsCards = () => {
    if (!statsData) return null;

    const cards = [
      {
        title: "Total",
        value: statsData.total,
        icon: "notifications",
        color: "#8B593E",
      },
      {
        title: "Sent",
        value: statsData.sent,
        icon: "checkmark-circle",
        color: "#10B981",
      },
      {
        title: "Pending",
        value: statsData.pending,
        icon: "time",
        color: "#F59E0B",
      },
      {
        title: "Upcoming",
        value: statsData.upcoming,
        icon: "calendar",
        color: "#3B82F6",
      },
    ];

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          {cards.map((card, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: card.color }]}>
                <Ionicons name={card.icon as any} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statTitle}>{card.title}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render status filter
  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Filter by status:</Text>
      <View style={styles.filterButtons}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'sent', label: 'Sent' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedStatus === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(filter.key as any)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedStatus === filter.key && styles.filterButtonTextActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Show error state if there are errors
  if (notificationsError || statsError) {
    return (
      <SafeScreen>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              Manage your task reminders and alerts
            </Text>
          </View>
          {renderErrorState()}
        </ScrollView>
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Manage your task reminders and alerts
          </Text>
        </View>


        {/* Generate Task Notifications Button */}
        <View style={styles.generateButtonContainer}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateTaskNotifications}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generate Task Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Filter */}
        {renderStatusFilter()}

        {/* Selection mode header */}
        {isSelectionMode && (
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionText}>
              {selectedNotifications.length} selected
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleBulkDelete}
                disabled={selectedNotifications.length === 0}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
                <Text style={styles.selectionButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedNotifications([]);
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
                <Text style={styles.selectionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.notificationsContainer}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.sectionTitle}>
              {selectedStatus === 'all' ? 'All Notifications' : 
               selectedStatus === 'pending' ? 'Pending Notifications' : 'Sent Notifications'}
            </Text>
            <TouchableOpacity
              style={styles.selectionToggle}
              onPress={() => setIsSelectionMode(!isSelectionMode)}
            >
              <Ionicons
                name={isSelectionMode ? "close" : "checkbox"}
                size={20}
                color="#8B593E"
              />
              <Text style={styles.selectionToggleText}>
                {isSelectionMode ? "Cancel" : "Select"}
              </Text>
            </TouchableOpacity>
          </View>

          {!notificationsData?.notifications || notificationsData.notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No notifications found</Text>
              <Text style={styles.emptySubtext}>
                {selectedStatus === 'all' ? 'You don\'t have any notifications yet. Try generating notifications for your incomplete tasks.' :
                 selectedStatus === 'pending' ? 'No pending notifications.' : 'No sent notifications.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={notificationsData.notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

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
  infoBanner: {
    backgroundColor: "#DBEAFE",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    marginLeft: 8,
    lineHeight: 20,
  },
  generateButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: "#8B593E",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  generateButtonSubtext: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#8B593E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 12,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  selectionHeader: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  selectionActions: {
    flexDirection: "row",
    gap: 12,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notificationsContainer: {
    paddingHorizontal: 20,
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectionToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectionToggleText: {
    fontSize: 14,
    color: "#8B593E",
    fontWeight: "500",
  },
  notificationItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  notificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  taskInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  notificationMeta: {
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  notificationActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 4,
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
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
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
