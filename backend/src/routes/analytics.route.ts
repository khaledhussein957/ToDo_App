import express from "express";
import {
  getAnalyticsDashboard,
  getTaskAnalytics,
  getCategoryAnalytics,
  getProductivityInsights,
  getCustomRangeAnalytics,
} from "../controller/analytics.controller.ts";
import { authMiddleware } from "../middleware/protectRoute.middleware.ts";
import { validateAnalyticsQuery } from "../validation/analytics.validate.ts";

const router = express.Router();

// Get overall analytics dashboard
router.get("/dashboard", authMiddleware, getAnalyticsDashboard);

// Get detailed task analytics with optional period parameter
router.get("/tasks", authMiddleware, validateAnalyticsQuery, getTaskAnalytics);

// Get category analytics
router.get("/categories", authMiddleware, getCategoryAnalytics);

// Get productivity insights with optional period parameter
router.get("/productivity", authMiddleware, validateAnalyticsQuery, getProductivityInsights);

// Get custom date range analytics
router.get("/custom-range", authMiddleware, validateAnalyticsQuery, getCustomRangeAnalytics);

export default router;
