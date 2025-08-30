import type { Request, Response, NextFunction } from "express";

import type { AuthenticatedRequest } from "./protectRoute.middleware.ts";

// Middleware to check if user has any tasks for analytics
export const checkUserHasTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const Task = (await import("../model/task.model.ts")).default;
    const taskCount = await Task.countDocuments({ userId: user.userId });

    if (taskCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No tasks found for analytics. Create some tasks first to see your analytics.",
        data: {
          overview: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 0,
            averageTasksPerDay: 0
          },
          categoryDistribution: [],
          priorityDistribution: [],
          weeklyTrend: [],
          monthlyProductivity: [],
          recentActivity: []
        }
      });
    }

    next();
  } catch (error) {
    console.error("Check user tasks middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check user tasks"
    });
  }
};

// Middleware to cache analytics data (basic implementation)
export const cacheAnalytics = (duration: number = 300) => { // 5 minutes default
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // This is a basic cache implementation
    // In production, you might want to use Redis or a more sophisticated caching solution
    
    const cacheKey = `analytics:${req.user?.userId}:${req.originalUrl}`;
    const cachedData = (global as any).analyticsCache?.[cacheKey];
    
    if (cachedData && cachedData.timestamp > Date.now() - (duration * 1000)) {
      return res.json(cachedData.data);
    }
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache the response
    res.json = function(data) {
      if (!(global as any).analyticsCache) {
        (global as any).analyticsCache = {};
      }
      
      (global as any).analyticsCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware to rate limit analytics requests
export const rateLimitAnalytics = (maxRequests: number = 100, windowMs: number = 900000) => { // 100 requests per 15 minutes
  const requests = new Map();
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const now = Date.now();
    const userRequests = requests.get(user.userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter((timestamp: number) => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many analytics requests. Please try again later."
      });
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(user.userId, validRequests);
    
    next();
  };
};

// Middleware to validate date range for analytics
export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date"
      });
    }
    
    // Check if date range is reasonable (not more than 1 year)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return res.status(400).json({
        success: false,
        message: "Date range cannot exceed 1 year"
      });
    }
  }
  
  next();
};

// Middleware to add analytics headers
export const addAnalyticsHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Analytics-Version': '1.0',
    'X-Analytics-Cache-Control': 'public, max-age=300',
    'X-Analytics-Data-Type': 'application/json'
  });
  
  next();
};

// Export all middleware functions
export default {
  checkUserHasTasks,
  cacheAnalytics,
  rateLimitAnalytics,
  validateDateRange,
  addAnalyticsHeaders
};
