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
  Image
} from "react-native";
import { router } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "../../store/slices/authSlice";
import { tokenUtils } from "../../store/Api/baseQuery";
import { RootState } from "../../store";
import { useGetAllCategoriesQuery } from "../../store/Api/categoryApi";
import SafeScreen from "../../components/SafeArea";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  category: string;
}

export default function HomeTab() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: categoriesData } = useGetAllCategoriesQuery();
  
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Mock data - replace with real data from your todo API
  const todayTasks: Task[] = [
    { id: "1", title: "Complete project presentation", completed: false, dueDate: "2024-01-15", category: "Work" },
    { id: "2", title: "Buy groceries", completed: true, dueDate: "2024-01-15", category: "Personal" },
    { id: "3", title: "Call dentist", completed: false, dueDate: "2024-01-15", category: "Health" },
    { id: "4", title: "Review code changes", completed: false, dueDate: "2024-01-15", category: "Work" },
  ];

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

  const stats = {
    completedToday: 8,
    pendingTasks: 12,
    overdueTasks: 3,
    totalCategories: categoriesData?.categories?.length || 0,
  };

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

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    
    // TODO: Add task to your todo API
    console.log("Adding task:", { title: newTaskTitle, category: selectedCategory });
    
    setNewTaskTitle("");
    setSelectedCategory("");
    setShowAddModal(false);
    Alert.alert("Success", "Task added successfully!");
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View style={[styles.taskItem, item.completed && styles.completedTask]}>
      <TouchableOpacity style={styles.taskCheckbox}>
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={20} 
          color={item.completed ? "#10B981" : "#6B7280"} 
        />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.completedTaskText]}>
          {item.title}
        </Text>
        <Text style={styles.taskCategory}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </View>
  );

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

          {/* Today's Tasks */}
          <View style={styles.tasksSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/todos")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={todayTasks.slice(0, 4)}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.tasksList}
            />
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Add Task Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Task</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
              />

              {categoriesData?.categories && categoriesData.categories.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryLabel}>Select Category (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                    {categoriesData.categories.map((category) => (
                      <TouchableOpacity
                        key={category._id}
                        style={[
                          styles.categoryChip,
                          selectedCategory === category._id && styles.selectedCategoryChip
                        ]}
                        onPress={() => setSelectedCategory(category._id)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          selectedCategory === category._id && styles.selectedCategoryChipText
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddTask}
                >
                  <Text style={styles.addButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  taskCheckbox: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "bold",
  },
  completedTask: {
    opacity: 0.7,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
  },
  taskCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
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
  categorySection: {
    width: "100%",
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
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4F46E5",
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
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
