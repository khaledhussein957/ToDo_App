import mongoose from "mongoose";
import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/protectRoute.middleware.ts";

import Task from "../model/task.model.ts";
import Category from "../model/category.model.ts";
import User from "../model/user.model.ts";

// Get overall analytics dashboard
export const getAnalyticsDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get basic stats
    const totalTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({ userId, completed: true });
    const pendingTasks = await Task.countDocuments({ userId, completed: false });
    const overdueTasks = await Task.countDocuments({
      userId,
      completed: false,
      dueDate: { $lt: new Date() }
    });

    // Get category distribution
    const categoryStats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          count: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          pending: { $sum: { $cond: ["$completed", 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority distribution
    const priorityStats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      }
    ]);

    // Get weekly completion trend (last 8 weeks)
    const weeklyTrend = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            week: { $week: "$updatedAt" }
          },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.week": -1 } },
      { $limit: 8 }
    ]);

    // Get monthly productivity
    const monthlyProductivity = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          tasksCreated: { $sum: 1 },
          tasksCompleted: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    // Get recent activity (last 7 days)
    const recentActivity = await Task.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          completed: 1,
          updatedAt: 1,
          categoryName: "$category.name",
          action: {
            $cond: [
              "$completed",
              "completed",
              "updated"
            ]
          }
        }
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 }
    ]);

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get average tasks per day
    const firstTask = await Task.findOne({ userId }).sort({ createdAt: 1 });
    const daysSinceFirstTask = firstTask 
      ? Math.ceil((Date.now() - firstTask.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const averageTasksPerDay = daysSinceFirstTask > 0 ? totalTasks / daysSinceFirstTask : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate: Math.round(completionRate * 100) / 100,
          averageTasksPerDay: Math.round(averageTasksPerDay * 100) / 100
        },
        categoryDistribution: categoryStats,
        priorityDistribution: priorityStats,
        weeklyTrend: weeklyTrend.reverse(),
        monthlyProductivity: monthlyProductivity.reverse(),
        recentActivity
      }
    });
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics dashboard"
    });
  }
};

// Get detailed task analytics
export const getTaskAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { period = "30" } = req.query; // days
    const days = parseInt(period as string);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Task creation trend
    const taskCreationTrend = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Task completion trend
    const taskCompletionTrend = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          updatedAt: { $gte: startDate },
          completed: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Tasks by status over time
    const tasksByStatus = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: { $cond: ["$completed", "completed", "pending"] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Average completion time (in days)
    const completionTimeStats = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          completed: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $addFields: {
          completionTime: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageCompletionTime: { $avg: "$completionTime" },
          minCompletionTime: { $min: "$completionTime" },
          maxCompletionTime: { $max: "$completionTime" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        taskCreationTrend,
        taskCompletionTrend,
        tasksByStatus,
        completionTimeStats: completionTimeStats[0] || {
          averageCompletionTime: 0,
          minCompletionTime: 0,
          maxCompletionTime: 0
        }
      }
    });
  } catch (error) {
    console.error("Task analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task analytics"
    });
  }
};

// Get category analytics
export const getCategoryAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

   

    // Category performance
    const categoryPerformance = await Task.aggregate([
      { $match: { userId: user.userId } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: ["$completed", 1, 0] } },
          pendingTasks: { $sum: { $cond: ["$completed", 0, 1] } },
          overdueTasks: {
            $sum: {
              $cond: [
                { $and: ["$completed", { $lt: ["$dueDate", new Date()] }] },
                1,
                0
              ]
            }
          },
          averagePriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] }, then: 1 }
                ],
                default: 2
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ["$completedTasks", "$totalTasks"] },
              100
            ]
          }
        }
      },
      { $sort: { totalTasks: -1 } }
    ]);

    // Category growth over time (last 6 months)
    const categoryGrowth = await Task.aggregate([
        { $match: { userId: user.userId } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: {
            category: "$category.name",
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 30 }
    ]);

    // Most productive categories (by completion rate)
    const mostProductiveCategories = categoryPerformance
      .filter(cat => cat.totalTasks >= 3) // Only categories with at least 3 tasks
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        categoryPerformance,
        categoryGrowth,
        mostProductiveCategories
      }
    });
  } catch (error) {
    console.error("Category analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category analytics"
    });
  }
};

// Get productivity insights
export const getProductivityInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const { period = "30" } = req.query; // days
    const days = parseInt(period as string);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily productivity score
    const dailyProductivity = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          tasksCreated: { $sum: 1 },
          tasksCompleted: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      },
      {
        $addFields: {
          productivityScore: {
            $multiply: [
              { $divide: ["$tasksCompleted", { $max: ["$tasksCreated", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Weekly productivity summary
    const weeklyProductivity = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          tasksCreated: { $sum: 1 },
          tasksCompleted: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      },
      {
        $addFields: {
          productivityScore: {
            $multiply: [
              { $divide: ["$tasksCompleted", { $max: ["$tasksCreated", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    // Best performing days
    const bestDays = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          tasksCreated: { $sum: 1 },
          tasksCompleted: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      },
      {
        $addFields: {
          dayName: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                { case: { $eq: ["$_id", 7] }, then: "Saturday" }
              ]
            }
          },
          productivityScore: {
            $multiply: [
              { $divide: ["$tasksCompleted", { $max: ["$tasksCreated", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { productivityScore: -1 } }
    ]);

    // Streak analysis
    const streakData = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          completed: true,
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" }
          },
          completedCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Calculate current streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayData = streakData.find(day => 
        day._id.year === checkDate.getFullYear() &&
        day._id.month === checkDate.getMonth() + 1 &&
        day._id.day === checkDate.getDate()
      );

      if (dayData && dayData.completedCount > 0) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        tempStreak = 0;
      }
    }

    if (tempStreak > maxStreak) maxStreak = tempStreak;

    res.status(200).json({
      success: true,
      data: {
        dailyProductivity,
        weeklyProductivity,
        bestDays,
        streaks: {
          currentStreak,
          maxStreak
        }
      }
    });
  } catch (error) {
    console.error("Productivity insights error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch productivity insights"
    });
  }
};

// Get custom date range analytics
export const getCustomRangeAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    // Basic stats for custom range
    const totalTasks = await Task.countDocuments({
      userId: user.userId,
      createdAt: { $gte: start, $lte: end }
    });

    const completedTasks = await Task.countDocuments({
      userId: user.userId,
      completed: true,
      updatedAt: { $gte: start, $lte: end }
    });

    const overdueTasks = await Task.countDocuments({
      userId: user.userId,
      completed: false,
      dueDate: { $lt: new Date(), $gte: start, $lte: end }
    });

    // Daily breakdown
    const dailyBreakdown = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          created: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Priority distribution for custom range
    const priorityDistribution = await Task.aggregate([
      {
        $match: {
          userId: user.userId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        overview: {
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        },
        dailyBreakdown,
        priorityDistribution
      }
    });
  } catch (error) {
    console.error("Custom range analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom range analytics"
    });
  }
};
