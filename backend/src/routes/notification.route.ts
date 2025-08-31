import express from "express";
import {
  createNotification,
  getUserNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsSent,
  bulkDeleteNotifications,
  getNotificationStats,
  getUpcomingNotifications,
  generateTaskNotifications,
} from "../controller/notification.controller.ts";
import { authMiddleware } from "../middleware/protectRoute.middleware.ts";
import {
  validateCreateNotification,
  validateUpdateNotification,
  validateBulkDelete,
  validateNotificationQuery,
} from "../validation/notification.validate.ts";

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Create a new notification
router.post("/", validateCreateNotification, createNotification);

// Generate notifications for incomplete tasks
router.post("/generate-task-notifications", generateTaskNotifications);

// Get all notifications for the authenticated user
router.get("/", validateNotificationQuery, getUserNotifications);

// Get notification statistics
router.get("/stats", getNotificationStats);

// Get upcoming notifications
router.get("/upcoming", getUpcomingNotifications);

// Get a specific notification
router.get("/:notificationId", getNotification);

// Update a notification
router.put("/:notificationId", validateUpdateNotification, updateNotification);

// Mark notification as sent
router.patch("/:notificationId/sent", markNotificationAsSent);

// Delete a notification
router.delete("/:notificationId", deleteNotification);

// Bulk delete notifications
router.delete("/bulk/delete", validateBulkDelete, bulkDeleteNotifications);

export default router;
