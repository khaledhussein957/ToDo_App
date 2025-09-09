import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Task } from "../store/Api/taskApi";

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDetailsModal({
  visible,
  task,
  onClose,
  onComplete,
  onDelete,
}: TaskDetailsModalProps) {
  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Task Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView
            style={styles.taskDetailScroll}
            contentContainerStyle={styles.taskDetailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Task Title */}
            <View style={styles.taskDetailHeader}>
              <Text style={styles.taskDetailTitle}>{task.title}</Text>
              {task.completed && (
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
            {task.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.taskDetailDescription}>
                  {task.description}
                </Text>
              </View>
            )}

            {/* Task Meta */}
            <View style={styles.taskDetailMeta}>
              <Text style={styles.sectionLabel}>Details</Text>

              {(task.category || (task.categoryId && typeof task.categoryId === 'object' && task.categoryId.name)) && (
                <View style={styles.detailTag}>
                  <Ionicons
                    name="folder-outline"
                    size={16}
                    color="#8B593E"
                  />
                  <Text style={styles.detailTagText}>
                    {typeof task.categoryId === 'object' && task.categoryId.name 
                      ? task.categoryId.name 
                      : task.category}
                  </Text>
                </View>
              )}

              {task.dueDate && (
                <View style={styles.detailTag}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color="#8B593E"
                  />
                  <Text style={styles.detailTagText}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {task.priority && (
                <View
                  style={[
                    styles.detailTag,
                    task.priority === "high"
                      ? styles.priorityHigh
                      : task.priority === "medium"
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
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)} Priority
                  </Text>
                </View>
              )}

              {task.recurrence && (
                <View style={styles.detailTag}>
                  <Ionicons
                    name="repeat-outline"
                    size={16}
                    color="#8B593E"
                  />
                  <Text style={styles.detailTagText}>
                    {task.recurrence}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags Section */}
            {(() => {
              let tagsArray: string[] = [];
              if (task.tags) {
                if (typeof task.tags === "string") {
                  try {
                    tagsArray = JSON.parse(task.tags);
                  } catch (e) {
                    tagsArray = [];
                  }
                } else if (Array.isArray(task.tags)) {
                  tagsArray = task.tags;
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
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {task.updatedAt !== task.createdAt && (
                  <View style={styles.timestampItem}>
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.timestampText}>
                      Updated: {new Date(task.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Attachments Section */}
            {(task.document ||
              (task.attachments && task.attachments.length > 0)) && (
              <View style={styles.taskDetailMeta}>
                <Text style={styles.sectionLabel}>Attachments</Text>

                {task.document && (
                  <TouchableOpacity
                    style={styles.attachmentItem}
                    onPress={() => {
                      if (task.document) {
                        Linking.openURL(task.document).catch((err) => {
                          Alert.alert("Error", "Could not open document");
                        });
                      }
                    }}
                  >
                    <Ionicons name="document" size={16} color="#8B593E" />
                    <Text style={styles.attachmentText}>
                      {task.document.split("/").pop() || "View Document"}
                    </Text>
                    <Ionicons
                      name="open-outline"
                      size={14}
                      color="#8B593E"
                      style={{ marginLeft: "auto" }}
                    />
                  </TouchableOpacity>
                )}

                {task.attachments &&
                  task.attachments.length > 0 &&
                  task.attachments.map((attachment, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.attachmentItem}
                      onPress={() => {
                        if (attachment) {
                          Linking.openURL(attachment).catch((err) => {
                            Alert.alert("Error", "Could not open attachment");
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

          {/* Action Buttons */}
          <View style={styles.taskDetailActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: task.completed ? "#10B981" : "#8B593E",
                },
              ]}
              onPress={() => onComplete(task._id)}
            >
              <Ionicons
                name={
                  task.completed ? "checkmark-circle" : "ellipse-outline"
                }
                size={20}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>
                {task.completed ? "Completed" : "Mark Complete"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              onPress={() => onDelete(task._id)}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  taskDetailScroll: {
    flex: 1,
    minHeight: 200,
  },
  taskDetailScrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
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
  descriptionContainer: {
    marginBottom: 16,
  },
  taskDetailDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  taskDetailMeta: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
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
  priorityHigh: {
    backgroundColor: "#FEE2E2",
  },
  priorityMedium: {
    backgroundColor: "#FEF3C7",
  },
  priorityLow: {
    backgroundColor: "#D1FAE5",
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
  taskDetailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
