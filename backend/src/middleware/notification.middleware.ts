import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./protectRoute.middleware.js";
import Notification from "../model/notification.model.js";

// Middleware to check if user has any notifications
export const checkUserHasNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const notificationCount = await Notification.countDocuments({ userId });

    if (notificationCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No notifications found",
        data: {
          notifications: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    next();
  } catch (error) {
    console.error("Check user notifications middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check user notifications"
    });
  }
};

// Middleware to rate limit notification creation
export const rateLimitNotificationCreation = (maxNotifications: number = 10, windowMs: number = 3600000) => { // 10 notifications per hour
  const userNotifications = new Map();
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const now = Date.now();
    const userData = userNotifications.get(userId) || { count: 0, resetTime: now + windowMs };
    
    // Reset counter if window has passed
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + windowMs;
    }
    
    if (userData.count >= maxNotifications) {
      return res.status(429).json({
        success: false,
        message: `Too many notifications created. Limit is ${maxNotifications} per hour.`
      });
    }
    
    userData.count++;
    userNotifications.set(userId, userData);
    
    next();
  };
};

// Middleware to cache notification data (basic implementation)
export const cacheNotifications = (duration: number = 300) => { // 5 minutes default
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const cacheKey = `notifications:${userId}:${req.originalUrl}`;
    const cachedData = (global as any).notificationCache?.[cacheKey];
    
    if (cachedData && cachedData.timestamp > Date.now() - (duration * 1000)) {
      return res.json(cachedData.data);
    }
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache the response
    res.json = function(data) {
      if (!(global as any).notificationCache) {
        (global as any).notificationCache = {};
      }
      
      (global as any).notificationCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware to validate notification ownership
export const validateNotificationOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied"
      });
    }
    
    // Add notification to request for use in controller
    (req as any).notification = notification;
    next();
  } catch (error) {
    console.error("Validate notification ownership error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate notification ownership"
    });
  }
};

// Middleware to check notification limits
export const checkNotificationLimits = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    // Check total notifications limit (e.g., 100 per user)
    const totalNotifications = await Notification.countDocuments({ userId });
    const maxNotifications = 100; // Configurable limit
    
    if (totalNotifications >= maxNotifications) {
      return res.status(400).json({
        success: false,
        message: `Maximum number of notifications (${maxNotifications}) reached. Please delete some notifications before creating new ones.`
      });
    }
    
    // Check pending notifications limit (e.g., 20 pending per user)
    const pendingNotifications = await Notification.countDocuments({
      userId,
      sent: false
    });
    const maxPendingNotifications = 20; // Configurable limit
    
    if (pendingNotifications >= maxPendingNotifications) {
      return res.status(400).json({
        success: false,
        message: `Maximum number of pending notifications (${maxPendingNotifications}) reached. Please wait for some notifications to be sent before creating new ones.`
      });
    }
    
    next();
  } catch (error) {
    console.error("Check notification limits error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check notification limits"
    });
  }
};

// Middleware to add notification headers
export const addNotificationHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Notification-Version': '1.0',
    'X-Notification-Cache-Control': 'public, max-age=300',
    'X-Notification-Data-Type': 'application/json'
  });
  
  next();
};

// Middleware to process notification scheduling
export const processNotificationScheduling = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { notifyAt } = req.body;
    
    if (notifyAt) {
      const notificationDate = new Date(notifyAt);
      const now = new Date();
      
      // If notification is scheduled for the past, adjust to 5 minutes from now
      if (notificationDate <= now) {
        const adjustedDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        req.body.notifyAt = adjustedDate.toISOString();
      }
    }
    
    next();
  } catch (error) {
    console.error("Process notification scheduling error:", error);
    next(); // Continue even if there's an error
  }
};

// Export all middleware functions
export default {
  checkUserHasNotifications,
  rateLimitNotificationCreation,
  cacheNotifications,
  validateNotificationOwnership,
  checkNotificationLimits,
  addNotificationHeaders,
  processNotificationScheduling
};
