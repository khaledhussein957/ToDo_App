import mongoose from "mongoose";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/protectRoute.middleware.ts";
import Notification from "../model/notification.model.ts";
import Task from "../model/task.model.ts";

// Create a new notification
export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, message, taskId, notifyAt } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Validate that the task exists and belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or access denied"
      });
    }

    // Validate notifyAt date
    const notificationDate = new Date(notifyAt);
    if (notificationDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Notification time must be in the future"
      });
    }

    const notification = new Notification({
      title,
      message,
      userId,
      taskId,
      notifyAt: notificationDate,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification"
    });
  }
};

// Generate notifications for incomplete tasks
export const generateTaskNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Find all incomplete tasks with due dates
    const incompleteTasks = await Task.find({
      userId,
      completed: false,
      dueDate: { $exists: true, $ne: null }
    });

    const createdNotifications = [];
    const now = new Date();

    for (const task of incompleteTasks) {
      // Check if notification already exists for this task
      const existingNotification = await Notification.findOne({
        userId,
        taskId: task._id,
        sent: false
      });

      if (!existingNotification) {
        // Calculate notification time (1 hour before due date)
        const notificationTime = new Date(task.dueDate);
        notificationTime.setHours(notificationTime.getHours() - 1);

        // Only create notification if it's in the future
        if (notificationTime > now) {
          const notification = new Notification({
            title: `Task Reminder: ${task.title}`,
            message: `Your task "${task.title}" is due in 1 hour. Priority: ${task.priority}`,
            userId,
            taskId: task._id,
            notifyAt: notificationTime,
          });

          await notification.save();
          createdNotifications.push(notification);
        }
      }
    }

    res.json({
      success: true,
      message: `${createdNotifications.length} notifications generated for incomplete tasks`,
      data: createdNotifications
    });
  } catch (error) {
    console.error("Generate task notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate task notifications"
    });
  }
};

// Get all notifications for the authenticated user
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const query: any = { userId };

    // Add status filter if provided
    if (status === 'sent') {
      query.sent = true;
    } else if (status === 'pending') {
      query.sent = false;
    }

    const notifications = await Notification.find(query)
      .populate('taskId', 'title description dueDate priority')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      message: "Notifications retrieved successfully",
      notifications,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      }
    });
  } catch (error) {
    console.error("Get user notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications"
    });
  }
};

// Get notification statistics
export const getNotificationStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, sent, pending, todayTotal, todaySent, upcoming] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, sent: true }),
      Notification.countDocuments({ userId, sent: false }),
      Notification.countDocuments({ 
        userId, 
        createdAt: { $gte: today, $lt: tomorrow } 
      }),
      Notification.countDocuments({ 
        userId, 
        sent: true, 
        createdAt: { $gte: today, $lt: tomorrow } 
      }),
      Notification.countDocuments({ 
        userId, 
        notifyAt: { $gt: new Date() } 
      }),
    ]);

    res.json({
      success: true,
      message: "Statistics retrieved successfully",
      total,
      sent,
      pending,
      todayTotal,
      todaySent,
      upcoming,
    });
  } catch (error) {
    console.error("Get notification stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics"
    });
  }
};

// Get upcoming notifications
export const getUpcomingNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const notifications = await Notification.find({
      userId,
      notifyAt: { $gt: new Date() }
    })
      .populate('taskId', 'title description dueDate priority')
      .sort({ notifyAt: 1 })
      .limit(Number(limit));

    res.json({
      success: true,
      message: "Upcoming notifications retrieved successfully",
      notifications
    });
  } catch (error) {
    console.error("Get upcoming notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve upcoming notifications"
    });
  }
};

// Get a specific notification
export const getNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    }).populate('taskId', 'title description dueDate priority');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification retrieved successfully",
      data: notification
    });
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification"
    });
  }
};

// Update a notification
export const updateNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;
    const { title, message, notifyAt } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Validate notifyAt date if provided
    if (notifyAt) {
      const notificationDate = new Date(notifyAt);
      if (notificationDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Notification time must be in the future"
        });
      }
      notification.notifyAt = notificationDate;
    }

    if (title) notification.title = title;
    if (message) notification.message = message;

    await notification.save();

    res.json({
      success: true,
      message: "Notification updated successfully",
      data: notification
    });
  } catch (error) {
    console.error("Update notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification"
    });
  }
};

// Mark notification as sent
export const markNotificationAsSent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId
      },
      { sent: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification marked as sent",
      data: notification
    });
  } catch (error) {
    console.error("Mark notification as sent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as sent"
    });
  }
};

// Delete a notification
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification"
    });
  }
};

// Bulk delete notifications
export const bulkDeleteNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { notificationIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Notification IDs array is required"
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted successfully`
    });
  } catch (error) {
    console.error("Bulk delete notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notifications"
    });
  }
};
