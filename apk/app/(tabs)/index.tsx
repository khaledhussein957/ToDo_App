import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "../../store/slices/authSlice";
import { tokenUtils } from "../../store/Api/baseQuery";
import { RootState } from "../../store";
import { useGetAllCategoriesQuery } from "../../store/Api/categoryApi";
import { useGetTasksQuery, useCreateTaskMutation, Task } from "../../store/Api/taskApi";
import { useGetNotificationStatsQuery, useGenerateTaskNotificationsMutation } from "../../store/Api/notificationApi";
import SafeScreen from "../../components/SafeArea";

export default function HomeTab() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: tasksData, isLoading: isLoadingTasks, refetch: refetchTasks } = useGetTasksQuery();
  const { data: notificationStats, isLoading: isLoadingStats } = useGetNotificationStatsQuery();
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [generateTaskNotifications] = useGenerateTaskNotificationsMutation();
  
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");

  // Load user data from storage on component mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await tokenUtils.getUser();
        if (storedUser) {
          setUserFromStorage(storedUser);
        }
      } catch (error) {
        console.log("Error loading user from storage:", error);
      }
    };

    loadUserFromStorage();
  }, []);

  // Use user from storage if available, then Redux state
  const currentUser = userFromStorage || user;

  // Get today's tasks
  const getTodayTasks = () => {
    if (!tasksData?.tasks) return [];
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return tasksData.tasks.filter((task: Task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === todayString;
    }).slice(0, 4); // Show only first 4 tasks
  };

  const todayTasks = getTodayTasks();

  // Calculate stats
  const calculateStats = () => {
    if (!tasksData?.tasks) {
      return {
        completedToday: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalCategories: categoriesData?.categories?.length || 0,
      };
    }

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const now = new Date();

    const completedToday = tasksData.tasks.filter((task: Task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === todayString && task.completed;
    }).length;

    const pendingTasks = tasksData.tasks.filter((task: Task) => !task.completed).length;

    const overdueTasks = tasksData.tasks.filter((task: Task) => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < now;
    }).length;

    return {
      completedToday,
      pendingTasks,
      overdueTasks,
      totalCategories: categoriesData?.categories?.length || 0,
    };
  };

  const stats = calculateStats();

  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            tokenUtils.removeToken();
            tokenUtils.removeUser();
            dispatch(logout());
            router.replace("/(auth)");
          },
        },
      ]
    );
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    
    try {
      const taskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        priority: selectedPriority as "low" | "medium" | "high",
        ...(selectedCategory && { categoryId: selectedCategory }),
      };

      await createTask(taskData).unwrap();
      
      setNewTaskTitle("");
      setNewTaskDescription("");
      setSelectedCategory("");
      setSelectedPriority("medium");
      setShowAddModal(false);
      
      Alert.alert("Success", "Task added successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to add task. Please try again.");
    }
  };

  const handleGenerateNotifications = async () => {
    try {
      const result = await generateTaskNotifications().unwrap();
      Alert.alert("Success", result.message);
    } catch (error) {
      Alert.alert("Error", "Failed to generate notifications");
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      style={[styles.taskItem, item.completed && styles.completedTask]}
      onPress={() => router.push(`/(tabs)/todos`)}
    >
      <View style={styles.taskCheckbox}>
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={20} 
          color={item.completed ? "#10B981" : "#6B7280"} 
        />
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.completedTaskText]}>
          {item.title}
        </Text>
        <View style={styles.taskMeta}>
          {item.categoryId && typeof item.categoryId === 'object' && (
            <Text style={styles.taskCategory}>{item.categoryId.name}</Text>
          )}
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority || 'medium') }]}>
            <Text style={styles.priorityText}>{item.priority || 'medium'}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {getGreeting()}, {currentUser?.name || "User"} 👋
            </Text>
            <Text style={styles.date}>{getCurrentDate()}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatCard("Completed", stats.completedToday, "checkmark-circle", "#10B981")}
              {renderStatCard("Pending", stats.pendingTasks, "time-outline", "#F59E0B")}
              {renderStatCard("Overdue", stats.overdueTasks, "alert-circle", "#EF4444")}
              {renderStatCard("Categories", stats.totalCategories, "folder-outline", "#8B593E")}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={handleGenerateNotifications}
              >
                <Ionicons name="notifications" size={24} color="#8B593E" />
                <Text style={styles.quickActionText}>Generate Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/analytics")}
              >
                <Ionicons name="analytics" size={24} color="#8B593E" />
                <Text style={styles.quickActionText}>View Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Tasks */}
          <View style={styles.tasksSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/todos")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {todayTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No tasks for today</Text>
                <Text style={styles.emptySubtext}>Great job! All caught up.</Text>
              </View>
            ) : (
              <FlatList
                data={todayTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                style={styles.tasksList}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  date: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 5,
  },
  profileButton: {
    padding: 5,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  statCard: {
    width: "48%", // Two columns
    backgroundColor: "#F9FAFB",
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: "#374151",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  tasksSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "bold",
  },
  tasksList: {
    // No specific styles needed for FlatList, items are handled by renderItem
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskCategory: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  completedTask: {
    opacity: 0.7,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 12,
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
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8B593E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  prioritySection: {
    marginBottom: 20,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  selectedPriorityButtonText: {
    color: "#FFFFFF",
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  categoryList: {
    // No specific styles needed for ScrollView, items are handled by renderItem
  },
  categoryChip: {
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedCategoryChip: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8B593E",
  },
  selectedCategoryChipText: {
    color: "#FFFFFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#8B593E",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
