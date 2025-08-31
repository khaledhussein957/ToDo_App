import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { tokenUtils } from "../../store/Api/baseQuery";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useCompleteTaskMutation,
  useDeleteTaskMutation,
  Task,
  CreateTaskRequest,
} from "../../store/Api/taskApi";
import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  Category,
  CreateCategoryRequest,
} from "../../store/Api/categoryApi";
import SafeScreen from "../../components/SafeArea";

interface FilterState {
  search: string;
  category: string;
  status: string;
  priority: string;
}

export default function TodosTab() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [userFromStorage, setUserFromStorage] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // API hooks
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useGetTasksQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [createCategory, { isLoading: isCreatingCategory }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] =
    useDeleteCategoryMutation();

  // State management
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    status: "",
    priority: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: "",
    description: "",
    dueDate: "",
    category: "",
    priority: "medium",
    tags: undefined,
    recurrence: null,
    attachments: [],
  });
  const [newCategory, setNewCategory] = useState<CreateCategoryRequest>({
    name: "",
  });
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{
      uri: string;
      type: string;
      name: string;
    }>
  >([]);
  const [tagsInputText, setTagsInputText] = useState("");

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

  // Reset tags input when modal opens
  useEffect(() => {
    if (showAddModal) {
      setTagsInputText("");
    }
  }, [showAddModal]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const closeDropdowns = () => {
      setShowCategoryDropdown(false);
      setShowStatusDropdown(false);
      setShowPriorityDropdown(false);
    };

    // Close dropdowns when any modal opens
    if (
      showAddModal ||
      showTaskModal ||
      showCategoriesModal ||
      showDatePicker
    ) {
      closeDropdowns();
    }
  }, [showAddModal, showTaskModal, showCategoriesModal, showDatePicker]);

  // Filter tasks based on current filters
  const filteredTasks =
    tasksData?.tasks?.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description &&
          task.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()));
      
      // Fix category filtering - check both categoryId._id and categoryId
      const matchesCategory =
        !filters.category || 
        (task.categoryId && 
          (typeof task.categoryId === 'string' 
            ? task.categoryId === filters.category
            : task.categoryId._id === filters.category));
      
      const matchesStatus =
        !filters.status ||
        (filters.status === "completed" && task.completed) ||
        (filters.status === "pending" && !task.completed);
      const matchesPriority =
        !filters.priority || task.priority === filters.priority;

      return (
        matchesSearch && matchesCategory && matchesStatus && matchesPriority
      );
    }) || [];

  // Calculate stats
  const stats = {
    total: tasksData?.tasks?.length || 0,
    completed: tasksData?.tasks?.filter((task) => task.completed).length || 0,
    pending: tasksData?.tasks?.filter((task) => !task.completed).length || 0,
    overdue:
      tasksData?.tasks?.filter(
        (task) =>
          !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
      ).length || 0,
  };

  // Handle date selection
  const handleDateChange = (date: Date) => {
    setTempDate(date);
  };

  const handleConfirmDate = () => {
    setSelectedDate(tempDate);
    const formattedDate = tempDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    setNewTask((prev) => ({ ...prev, dueDate: formattedDate }));
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  // Handle file picking
  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => {
          // Create a proper File object from the asset
          const file = {
            uri: asset.uri,
            type: asset.mimeType || "application/octet-stream",
            name: asset.name || "document",
          };
          return file;
        });
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.log("Error picking files:", error);
      Alert.alert("Error", "Failed to pick files");
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle task creation
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }

    if (!newTask.category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    if (!newTask.dueDate) {
      Alert.alert("Error", "Please select a due date");
      return;
    }

    if (!newTask.priority) {
      Alert.alert("Error", "Please select a priority");
      return;
    }

    try {
      const taskWithFiles = {
        ...newTask,
        tags: newTask.tags, // newTask.tags is already a JSON string
        attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      };
      await createTask(taskWithFiles).unwrap();
      setShowAddModal(false);
      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        category: "",
        priority: "medium",
        tags: undefined,
        recurrence: null,
        attachments: [],
      });
      setSelectedFiles([]);
      setSelectedDate(new Date());
      setTagsInputText("");
      Alert.alert("Success", "Task created successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to create task");
    }
  };

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId).unwrap();
      Alert.alert("Success", "Task completed!");
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to complete task");
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(taskId).unwrap();
            setShowTaskModal(false);
            setSelectedTask(null);
            Alert.alert("Success", "Task deleted successfully!");
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.data?.message || "Failed to delete task"
            );
          }
        },
      },
    ]);
  };

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    try {
      await createCategory(newCategory).unwrap();
      setNewCategory({ name: "" });
      Alert.alert("Success", "Category created successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to create category");
    }
  };

  // Handle category update
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    try {
      await updateCategory({
        id: editingCategory.id,
        name: editingCategory.name,
      }).unwrap();
      setEditingCategory(null);
      Alert.alert("Success", "Category updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error?.data?.message || "Failed to update category");
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${categoryName}"? This will also remove it from all associated tasks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(categoryId).unwrap();
              Alert.alert("Success", "Category deleted successfully!");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.data?.message || "Failed to delete category"
              );
            }
          },
        },
      ]
    );
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskItem, item.completed && styles.completedTask]}
      onPress={() => {
        setSelectedTask(item);
        setShowTaskModal(true);
      }}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => handleCompleteTask(item._id)}
      >
        <Ionicons
          name={item.completed ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={item.completed ? "#10B981" : "#6B7280"}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[styles.taskTitle, item.completed && styles.completedTaskText]}
        >
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.taskMeta}>
          {(item.category || (item.categoryId && typeof item.categoryId === 'object' && item.categoryId.name)) && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {typeof item.categoryId === 'object' && item.categoryId.name 
                  ? item.categoryId.name 
                  : item.category}
              </Text>
            </View>
          )}
          {item.dueDate && (
            <Text
              style={[
                styles.dueDate,
                new Date(item.dueDate) < new Date() &&
                  !item.completed &&
                  styles.overdue,
              ]}
            >
              {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
          {item.priority && (
            <View
              style={[
                styles.priorityTag,
                item.priority === "high"
                  ? styles.priorityHigh
                  : item.priority === "medium"
                  ? styles.priorityMedium
                  : styles.priorityLow,
              ]}
            >
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          )}
          {item.document && (
            <View style={styles.attachmentIndicator}>
              <Ionicons name="document" size={12} color="#6B7280" />
              <Text style={styles.attachmentCount}>1</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  // State for dropdown visibility
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Render filter dropdown
  const renderFilterDropdown = (
    title: string,
    value: string,
    options: { label: string; value: string }[],
    onSelect: (value: string) => void,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void
  ) => {
    const selectedOption = options.find((option) => option.value === value) || {
      label: "All",
      value: "",
    };

    return (
      <View style={styles.filterDropdown}>
        <Text style={styles.filterLabel}>{title}</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.dropdownButtonText}>{selectedOption.label}</Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                value === "" && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onSelect("");
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  value === "" && { color: "#8B593E", fontWeight: "600" },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownItem,
                  value === option.value && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === option.value && {
                      color: "#8B593E",
                      fontWeight: "600",
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={filters.search}
            onChangeText={(text) =>
              setFilters((prev) => ({ ...prev, search: text }))
            }
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {renderFilterDropdown(
            "Category",
            filters.category,
            categoriesData?.categories?.map((cat) => ({
              label: cat.name,
              value: cat._id,
            })) || [],
            (value) => setFilters((prev) => ({ ...prev, category: value })),
            showCategoryDropdown,
            setShowCategoryDropdown
          )}
          {renderFilterDropdown(
            "Status",
            filters.status,
            [
              { label: "Pending", value: "pending" },
              { label: "Completed", value: "completed" },
            ],
            (value) => setFilters((prev) => ({ ...prev, status: value })),
            showStatusDropdown,
            setShowStatusDropdown
          )}
          {renderFilterDropdown(
            "Priority",
            filters.priority,
            [
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" },
            ],
            (value) => setFilters((prev) => ({ ...prev, priority: value })),
            showPriorityDropdown,
            setShowPriorityDropdown
          )}
        </View>

        {/* Clear Filters Button */}
        {(filters.category || filters.status || filters.priority) && (
          <View style={styles.clearFiltersContainer}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFilters({
                  search: filters.search,
                  category: "",
                  status: "",
                  priority: "",
                });
                setShowCategoryDropdown(false);
                setShowStatusDropdown(false);
                setShowPriorityDropdown(false);
              }}
            >
              <Ionicons name="close-circle" size={16} color="#6B7280" />
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {stats.completed}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {stats.pending}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {stats.overdue}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* Task List */}
        <View style={styles.taskListContainer}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color="#9CA3AF"
              />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {filters.search ||
                filters.category ||
                filters.status ||
                filters.priority
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.taskList}
            />
          )}
        </View>

        {/* Add Task Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.addTaskModalOverlay}>
            <View style={styles.addTaskModalContent}>
              <View style={styles.addTaskModalHeader}>
                <Text style={styles.modalTitle}>Add New Task</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setTagsInputText("");
                  }}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContentContainer}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Task title"
                  value={newTask.title}
                  onChangeText={(text) =>
                    setNewTask((prev) => ({ ...prev, title: text }))
                  }
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChangeText={(text) =>
                    setNewTask((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text
                    style={[
                      styles.dateInputText,
                      !newTask.dueDate && styles.dateInputPlaceholder,
                    ]}
                  >
                    {newTask.dueDate
                      ? new Date(newTask.dueDate).toLocaleDateString()
                      : "Select due date"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Category:</Text>
                {categoriesData?.categories &&
                categoriesData.categories.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryList}
                  >
                    {categoriesData.categories.map((category) => (
                      <TouchableOpacity
                        key={category._id}
                        style={[
                          styles.categoryChip,
                          newTask.category === category._id &&
                            styles.selectedCategoryChip,
                        ]}
                        onPress={() =>
                          setNewTask((prev) => ({
                            ...prev,
                            category: category._id,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            newTask.category === category._id &&
                              styles.selectedCategoryChipText,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noCategoriesContainer}>
                    <Text style={styles.noCategoriesText}>
                      No categories available
                    </Text>
                    <TouchableOpacity
                      style={styles.createCategoryButton}
                      onPress={() => {
                        setShowAddModal(false);
                        // Navigate to categories or show category creation modal
                        Alert.alert(
                          "Create Category",
                          "Please create a category first in the Categories tab, then come back to create tasks.",
                          [{ text: "OK", onPress: () => {} }]
                        );
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#8B593E"
                      />
                      <Text style={styles.createCategoryButtonText}>
                        Create Category
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.priorityContainer}>
                  <Text style={styles.priorityLabel}>Priority:</Text>
                  {["low", "medium", "high"].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityChip,
                        newTask.priority === priority &&
                          styles.selectedPriorityChip,
                      ]}
                      onPress={() =>
                        setNewTask((prev) => ({
                          ...prev,
                          priority: priority as any,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          newTask.priority === priority &&
                            styles.selectedPriorityChipText,
                        ]}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tags Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tags (comma separated):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., work, urgent, project"
                    value={tagsInputText}
                    onChangeText={(text) => {
                      setTagsInputText(text);
                      // Split by comma, trim whitespace, and filter out empty tags
                      const tags = text
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0);
                      // Only set tags if there are any, otherwise set to undefined
                      setNewTask((prev) => ({
                        ...prev,
                        tags:
                          tags.length > 0 ? JSON.stringify(tags) : undefined,
                      }));
                    }}
                  />
                </View>

                {/* Recurrence Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recurrence:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.recurrenceList}
                  >
                    <TouchableOpacity
                      style={[
                        styles.recurrenceChip,
                        newTask.recurrence === null &&
                          styles.selectedRecurrenceChip,
                      ]}
                      onPress={() =>
                        setNewTask((prev) => ({ ...prev, recurrence: null }))
                      }
                    >
                      <Text
                        style={[
                          styles.recurrenceChipText,
                          newTask.recurrence === null &&
                            styles.selectedRecurrenceChipText,
                        ]}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {["Daily", "Weekly", "Monthly"].map((recurrence) => (
                      <TouchableOpacity
                        key={recurrence}
                        style={[
                          styles.recurrenceChip,
                          newTask.recurrence === recurrence &&
                            styles.selectedRecurrenceChip,
                        ]}
                        onPress={() =>
                          setNewTask((prev) => ({
                            ...prev,
                            recurrence: recurrence as any,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceChipText,
                            newTask.recurrence === recurrence &&
                              styles.selectedRecurrenceChipText,
                          ]}
                        >
                          {recurrence}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* File Attachments */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Attachments:</Text>
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={handlePickFiles}
                  >
                    <Ionicons name="attach" size={20} color="#8B593E" />
                    <Text style={styles.filePickerButtonText}>Pick Files</Text>
                  </TouchableOpacity>

                  {selectedFiles.length > 0 && (
                    <View style={styles.selectedFilesContainer}>
                      {selectedFiles.map((file, index) => (
                        <View key={index} style={styles.selectedFileItem}>
                          <Ionicons name="document" size={16} color="#6B7280" />
                          <Text style={styles.selectedFileName}>
                            {file.name}
                          </Text>
                          <TouchableOpacity
                            style={styles.removeFileButton}
                            onPress={() => handleRemoveFile(index)}
                          >
                            <Ionicons name="close" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.addTaskModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setTagsInputText("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isCreating && styles.disabledButton,
                  ]}
                  onPress={handleCreateTask}
                  disabled={isCreating}
                >
                  <Text style={styles.saveButtonText}>
                    {isCreating ? "Creating..." : "Create Task"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Task Detail Modal */}
        <Modal
          visible={showTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTaskModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Task Details</Text>
                <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              {selectedTask && (
                <ScrollView
                  style={styles.taskDetailScroll}
                  contentContainerStyle={styles.taskDetailScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Task Title */}
                  <View style={styles.taskDetailHeader}>
                    <Text style={styles.taskDetailTitle}>
                      {selectedTask.title}
                    </Text>
                    {selectedTask.completed && (
                      <View style={styles.completedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    )}
                  </View>

                  {/* Task Description */}
                  {selectedTask.description && (
                    <Text style={styles.taskDetailDescription}>
                      {selectedTask.description}
                    </Text>
                  )}

                  {/* Task Meta */}
                  <View style={styles.taskDetailMeta}>
                    <Text style={styles.sectionLabel}>Details</Text>

                    {(selectedTask.category || (selectedTask.categoryId && typeof selectedTask.categoryId === 'object' && selectedTask.categoryId.name)) && (
                      <View style={styles.detailTag}>
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color="#8B593E"
                        />
                        <Text style={styles.detailTagText}>
                          {typeof selectedTask.categoryId === 'object' && selectedTask.categoryId.name 
                            ? selectedTask.categoryId.name 
                            : selectedTask.category}
                        </Text>
                      </View>
                    )}

                    {selectedTask.dueDate && (
                      <View style={styles.detailTag}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#8B593E"
                        />
                        <Text style={styles.detailTagText}>
                          Due:{" "}
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {selectedTask.priority && (
                      <View
                        style={[
                          styles.detailTag,
                          selectedTask.priority === "high"
                            ? styles.priorityHigh
                            : selectedTask.priority === "medium"
                            ? styles.priorityMedium
                            : styles.priorityLow,
                        ]}
                      >
                        <Ionicons
                          name="flag-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text
                          style={[styles.detailTagText, { color: "#FFFFFF" }]}
                        >
                          {selectedTask.priority.charAt(0).toUpperCase() +
                            selectedTask.priority.slice(1)}{" "}
                          Priority
                        </Text>
                      </View>
                    )}

                    {selectedTask.recurrence && (
                      <View style={styles.detailTag}>
                        <Ionicons
                          name="repeat-outline"
                          size={16}
                          color="#8B593E"
                        />
                        <Text style={styles.detailTagText}>
                          {selectedTask.recurrence}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Tags Section */}
                  {(() => {
                    let tagsArray: string[] = [];
                    if (selectedTask.tags) {
                      if (typeof selectedTask.tags === "string") {
                        try {
                          tagsArray = JSON.parse(selectedTask.tags);
                        } catch (e) {
                          tagsArray = [];
                        }
                      } else if (Array.isArray(selectedTask.tags)) {
                        tagsArray = selectedTask.tags;
                      }
                    }

                    return tagsArray.length > 0 ? (
                      <View style={styles.taskDetailMeta}>
                        <Text style={styles.sectionLabel}>Tags</Text>
                        <View style={styles.tagsContainer}>
                          {tagsArray.map((tag, index) => (
                            <View key={index} style={styles.tagChip}>
                              <Text style={styles.tagChipText}>#{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null;
                  })()}

                  {/* Timeline Section */}
                  <View style={styles.taskDetailMeta}>
                    <Text style={styles.sectionLabel}>Timeline</Text>
                    <View style={styles.timestampContainer}>
                      <View style={styles.timestampItem}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#6B7280"
                        />
                        <Text style={styles.timestampText}>
                          Created:{" "}
                          {new Date(
                            selectedTask.createdAt
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      {selectedTask.updatedAt !== selectedTask.createdAt && (
                        <View style={styles.timestampItem}>
                          <Ionicons
                            name="refresh-outline"
                            size={14}
                            color="#6B7280"
                          />
                          <Text style={styles.timestampText}>
                            Updated:{" "}
                            {new Date(
                              selectedTask.updatedAt
                            ).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Attachments Section */}
                  {(selectedTask.document ||
                    (selectedTask.attachments &&
                      selectedTask.attachments.length > 0)) && (
                    <View style={styles.taskDetailMeta}>
                      <Text style={styles.sectionLabel}>Attachments</Text>

                      {selectedTask.document && (
                        <TouchableOpacity
                          style={styles.attachmentItem}
                          onPress={() => {
                            if (selectedTask.document) {
                              Linking.openURL(selectedTask.document).catch(
                                (err) => {
                                  Alert.alert(
                                    "Error",
                                    "Could not open document"
                                  );
                                }
                              );
                            }
                          }}
                        >
                          <Ionicons name="document" size={16} color="#8B593E" />
                          <Text style={styles.attachmentText}>
                            {selectedTask.document.split("/").pop() ||
                              "View Document"}
                          </Text>
                          <Ionicons
                            name="open-outline"
                            size={14}
                            color="#8B593E"
                            style={{ marginLeft: "auto" }}
                          />
                        </TouchableOpacity>
                      )}

                      {selectedTask.attachments &&
                        selectedTask.attachments.length > 0 &&
                        selectedTask.attachments.map((attachment, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.attachmentItem}
                            onPress={() => {
                              if (attachment) {
                                Linking.openURL(attachment).catch((err) => {
                                  Alert.alert(
                                    "Error",
                                    "Could not open attachment"
                                  );
                                });
                              }
                            }}
                          >
                            <Ionicons
                              name="document"
                              size={16}
                              color="#8B593E"
                            />
                            <Text style={styles.attachmentText}>
                              Attachment {index + 1}
                            </Text>
                            <Ionicons
                              name="open-outline"
                              size={14}
                              color="#8B593E"
                              style={{ marginLeft: "auto" }}
                            />
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </ScrollView>
              )}

              {/* Action Buttons */}
              {selectedTask && (
                <View style={styles.taskDetailActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: selectedTask.completed
                          ? "#4CAF50"
                          : "#8B593E",
                      },
                    ]}
                    onPress={() => handleCompleteTask(selectedTask._id)}
                  >
                    <Ionicons
                      name={
                        selectedTask.completed
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>
                      {selectedTask.completed ? "Completed" : "Mark Complete"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#EF4444" },
                    ]}
                    onPress={() => handleDeleteTask(selectedTask._id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelDate}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Due Date</Text>
                <TouchableOpacity onPress={handleCancelDate}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContent}>
                <Text style={styles.datePickerLabel}>Date:</Text>
                <Text style={styles.datePickerValue}>
                  {tempDate.toLocaleDateString()}
                </Text>

                <View style={styles.datePickerButtons}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(tempDate);
                      newDate.setDate(newDate.getDate() - 1);
                      if (newDate >= new Date()) {
                        handleDateChange(newDate);
                      }
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#8B593E" />
                    <Text style={styles.datePickerButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(tempDate);
                      newDate.setDate(newDate.getDate() + 1);
                      handleDateChange(newDate);
                    }}
                  >
                    <Text style={styles.datePickerButtonText}>Next</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#8B593E"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelDate}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleConfirmDate}
                  >
                    <Text style={styles.saveButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Categories Management Modal */}
        <Modal
          visible={showCategoriesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoriesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Manage Categories</Text>
                <TouchableOpacity onPress={() => setShowCategoriesModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Add New Category */}
              <View style={styles.addCategorySection}>
                <Text style={styles.sectionLabel}>Add New Category</Text>
                <View style={styles.addCategoryInput}>
                  <TextInput
                    style={styles.categoryInput}
                    placeholder="Category name"
                    value={newCategory.name}
                    onChangeText={(text) => setNewCategory({ name: text })}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addCategoryButton,
                      isCreatingCategory && styles.disabledButton,
                    ]}
                    onPress={handleCreateCategory}
                    disabled={isCreatingCategory}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addCategoryButtonText}>
                      {isCreatingCategory ? "Adding..." : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Categories List */}
              <View style={styles.categoriesListSection}>
                <Text style={styles.sectionLabel}>Your Categories</Text>
                {categoriesData?.categories &&
                categoriesData.categories.length > 0 ? (
                  <ScrollView style={styles.categoriesList}>
                    {categoriesData.categories.map((category) => (
                      <View key={category._id} style={styles.categoryItem}>
                        {editingCategory?.id === category._id ? (
                          <View style={styles.editCategoryInput}>
                            <TextInput
                              style={styles.categoryInput}
                              value={editingCategory.name}
                              onChangeText={(text) =>
                                setEditingCategory({
                                  ...editingCategory,
                                  name: text,
                                })
                              }
                              autoFocus
                            />
                            <TouchableOpacity
                              style={[
                                styles.saveEditButton,
                                isUpdatingCategory && styles.disabledButton,
                              ]}
                              onPress={handleUpdateCategory}
                              disabled={isUpdatingCategory}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#FFFFFF"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelEditButton}
                              onPress={() => setEditingCategory(null)}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color="#6B7280"
                              />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.categoryItemContent}>
                            <Text style={styles.categoryItemName}>
                              {category.name}
                            </Text>
                            <View style={styles.categoryItemActions}>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() =>
                                  setEditingCategory({
                                    id: category._id,
                                    name: category.name,
                                  })
                                }
                              >
                                <Ionicons
                                  name="pencil"
                                  size={16}
                                  color="#8B593E"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() =>
                                  handleDeleteCategory(
                                    category._id,
                                    category.name
                                  )
                                }
                              >
                                <Ionicons
                                  name="trash"
                                  size={16}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noCategoriesMessage}>
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                    <Text style={styles.noCategoriesMessageText}>
                      No categories yet
                    </Text>
                    <Text style={styles.noCategoriesMessageSubtext}>
                      Create your first category above
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Floating Action Buttons */}
        <View style={styles.floatingButtonsContainer}>
          {/* Manage Categories FAB */}
          <TouchableOpacity
            style={styles.floatingButtonSecondary}
            onPress={() => setShowCategoriesModal(true)}
          >
            <Ionicons name="folder-open" size={24} color="#8B593E" />
          </TouchableOpacity>

          {/* Add Task FAB */}
          <TouchableOpacity
            style={styles.floatingButtonPrimary}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#111827",
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterDropdown: {
    flex: 1,
    marginRight: 12,
    position: "relative",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
  },
  filterChipText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 2,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
  },
  clearFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  taskListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskList: {
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  completedTask: {
    opacity: 0.7,
    backgroundColor: "#F9FAFB",
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  taskDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#3730A3",
    fontWeight: "500",
  },
  dueDate: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 8,
  },
  overdue: {
    color: "#EF4444",
    fontWeight: "600",
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityHigh: {
    backgroundColor: "#FEE2E2",
  },
  priorityMedium: {
    backgroundColor: "#FEF3C7",
  },
  priorityLow: {
    backgroundColor: "#D1FAE5",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "500",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginVertical: 8,
  },
  taskDetailModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    width: "100%",
    maxHeight: "80%",
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  taskDetailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    alignSelf: "flex-start",
  },
  priorityChipText: {
    color: "#fff",
    fontWeight: "600",
  },
  attachmentSection: {
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  taskDetailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  taskDetailScroll: {
    flex: 1,
    minHeight: 200,
  },
  taskDetailScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: 350,
    maxHeight: "85%",
    flexDirection: "column",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryList: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedCategoryChip: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedCategoryChipText: {
    color: "#FFFFFF",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginRight: 12,
  },
  selectedPriorityChip: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
  },
  selectedPriorityChipText: {
    color: "#FFFFFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#8B593E",
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  taskDetail: {
    flex: 1,
  },
  taskDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  taskDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  taskDetailDescription: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 24,
  },
  taskDetailMeta: {
    marginBottom: 24,
  },
  detailTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  detailTagText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  completedActionButton: {
    backgroundColor: "#10B981",
  },
  deleteActionButton: {
    backgroundColor: "#EF4444",
  },
  completedActionButtonText: {
    color: "#FFFFFF",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  dateInputText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#111827",
  },
  dateInputPlaceholder: {
    color: "#9CA3AF",
  },
  datePickerModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: 350,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  datePickerContent: {
    alignItems: "center",
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  datePickerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B593E",
    marginBottom: 20,
  },
  datePickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B593E",
    marginHorizontal: 8,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  noCategoriesContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  noCategoriesText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
  },
  createCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  createCategoryButtonText: {
    fontSize: 14,
    color: "#8B593E",
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  floatingButtonsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    alignItems: "flex-end",
    gap: 12,
  },
  floatingButtonPrimary: {
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
  floatingButtonSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addCategorySection: {
    marginBottom: 24,
  },
  addCategoryInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B593E",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  addCategoryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesListSection: {
    flex: 1,
  },
  categoriesList: {
    maxHeight: 300,
  },
  categoryItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  categoryItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  editCategoryInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveEditButton: {
    backgroundColor: "#10B981",
    padding: 8,
    borderRadius: 6,
  },
  cancelEditButton: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noCategoriesMessage: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noCategoriesMessageText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 4,
  },
  noCategoriesMessageSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  recurrenceList: {
    marginBottom: 8,
  },
  recurrenceChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedRecurrenceChip: {
    backgroundColor: "#8B593E",
    borderColor: "#8B593E",
  },
  recurrenceChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectedRecurrenceChipText: {
    color: "#FFFFFF",
  },
  // Add Task Modal specific styles for full-screen presentation
  addTaskModalOverlay: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  addTaskModalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  addTaskModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  addTaskModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalScrollContent: {
    flex: 1,
  },
  modalScrollContentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  filePickerButtonText: {
    color: "#8B593E",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  selectedFilesContainer: {
    marginTop: 8,
  },
  selectedFileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  removeFileButton: {
    padding: 4,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  attachmentIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  attachmentCount: {
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 2,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 12,
    color: "#3730A3",
    fontWeight: "500",
  },
  timestampContainer: {
    gap: 8,
  },
  timestampItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestampText: {
    fontSize: 14,
    color: "#6B7280",
  },
  debugText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
});
