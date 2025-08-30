import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

// Analytics response interfaces
export interface AnalyticsOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTasksPerDay: number;
}

export interface CategoryDistribution {
  _id: string;
  count: number;
  completed: number;
  pending: number;
}

export interface PriorityDistribution {
  _id: string;
  count: number;
  completed: number;
}

export interface WeeklyTrend {
  _id: {
    year: number;
    week: number;
  };
  completed: number;
  total: number;
}

export interface MonthlyProductivity {
  _id: {
    year: number;
    month: number;
  };
  tasksCreated: number;
  tasksCompleted: number;
}

export interface RecentActivity {
  _id: string;
  title: string;
  completed: boolean;
  updatedAt: string;
  categoryName?: string;
  action: string;
}

export interface AnalyticsDashboard {
  overview: AnalyticsOverview;
  categoryDistribution: CategoryDistribution[];
  priorityDistribution: PriorityDistribution[];
  weeklyTrend: WeeklyTrend[];
  monthlyProductivity: MonthlyProductivity[];
  recentActivity: RecentActivity[];
}

export interface TaskAnalytics {
  taskCreationTrend: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    count: number;
  }>;
  taskCompletionTrend: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    count: number;
  }>;
  tasksByStatus: Array<{
    _id: {
      date: string;
      status: string;
    };
    count: number;
  }>;
  completionTimeStats: {
    averageCompletionTime: number;
    minCompletionTime: number;
    maxCompletionTime: number;
  };
}

export interface CategoryPerformance {
  _id: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averagePriority: number;
  completionRate: number;
}

export interface CategoryGrowth {
  _id: {
    category: string;
    year: number;
    month: number;
  };
  count: number;
}

export interface CategoryAnalytics {
  categoryPerformance: CategoryPerformance[];
  categoryGrowth: CategoryGrowth[];
  mostProductiveCategories: CategoryPerformance[];
}

export interface DailyProductivity {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  tasksCreated: number;
  tasksCompleted: number;
  productivityScore: number;
}

export interface WeeklyProductivity {
  _id: {
    year: number;
    week: number;
  };
  tasksCreated: number;
  tasksCompleted: number;
  productivityScore: number;
}

export interface BestDay {
  _id: number;
  dayName: string;
  tasksCreated: number;
  tasksCompleted: number;
  productivityScore: number;
}

export interface Streaks {
  currentStreak: number;
  maxStreak: number;
}

export interface ProductivityInsights {
  dailyProductivity: DailyProductivity[];
  weeklyProductivity: WeeklyProductivity[];
  bestDays: BestDay[];
  streaks: Streaks;
}

export interface CustomRangeAnalytics {
  period: {
    startDate: string;
    endDate: string;
  };
  overview: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  dailyBreakdown: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    created: number;
    completed: number;
  }>;
  priorityDistribution: PriorityDistribution[];
}

// Query parameters
export interface AnalyticsQueryParams {
  period?: number;
  startDate?: string;
  endDate?: string;
}

// Create analytics API
export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  baseQuery,
  tagTypes: ["Analytics"],
  endpoints: (builder) => ({
    // Get analytics dashboard
    getAnalyticsDashboard: builder.query<AnalyticsDashboard, void>({
      query: () => ({
        url: "/analytics/dashboard",
        method: "GET",
      }),
      providesTags: ["Analytics"],
    }),

    // Get task analytics
    getTaskAnalytics: builder.query<TaskAnalytics, AnalyticsQueryParams>({
      query: (params) => ({
        url: "/analytics/tasks",
        method: "GET",
        params,
      }),
      providesTags: ["Analytics"],
    }),

    // Get category analytics
    getCategoryAnalytics: builder.query<CategoryAnalytics, void>({
      query: () => ({
        url: "/analytics/categories",
        method: "GET",
      }),
      providesTags: ["Analytics"],
    }),

    // Get productivity insights
    getProductivityInsights: builder.query<ProductivityInsights, AnalyticsQueryParams>({
      query: (params) => ({
        url: "/analytics/productivity",
        method: "GET",
        params,
      }),
      providesTags: ["Analytics"],
    }),

    // Get custom range analytics
    getCustomRangeAnalytics: builder.query<CustomRangeAnalytics, { startDate: string; endDate: string }>({
      query: (params) => ({
        url: "/analytics/custom-range",
        method: "GET",
        params,
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

// Export hooks
export const {
  useGetAnalyticsDashboardQuery,
  useGetTaskAnalyticsQuery,
  useGetCategoryAnalyticsQuery,
  useGetProductivityInsightsQuery,
  useGetCustomRangeAnalyticsQuery,
} = analyticsApi;

// Export for store configuration
export default analyticsApi;
