import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import { tokenUtils } from "./baseQuery";
import notificationService from "../../services/notificationService";

// Types
export interface Notification {
  _id: string;
  title: string;
  message: string;
  userId: string;
  taskId: string;
  createdAt: string;
  notifyAt: string;
  sent: boolean;
  taskId_details?: {
    _id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: string;
  };
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  taskId: string;
  notifyAt: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  notifyAt?: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  todayTotal: number;
  todaySent: number;
  upcoming: number;
}

export interface NotificationPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  status?: 'sent' | 'pending';
}

// Notification API
export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery,
  tagTypes: ["Notification", "NotificationStats"],
  endpoints: (builder) => ({
    // Get user notifications with pagination
    getUserNotifications: builder.query<NotificationListResponse, NotificationQueryParams>({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ _id }) => ({ type: "Notification" as const, id: _id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    // Get notification statistics
    getNotificationStats: builder.query<NotificationStats, void>({
      query: () => "/notifications/stats",
      providesTags: ["NotificationStats"],
    }),

    // Get upcoming notifications
    getUpcomingNotifications: builder.query<Notification[], { limit?: number }>({
      query: (params) => ({
        url: "/notifications/upcoming",
        method: "GET",
        params,
      }),
      providesTags: ["Notification"],
    }),

    // Get specific notification
    getNotification: builder.query<Notification, string>({
      query: (notificationId) => `/notifications/${notificationId}`,
      providesTags: (result, error, id) => [{ type: "Notification", id }],
    }),

    // Create notification
    createNotification: builder.mutation<{ success: boolean; message: string; data: Notification }, CreateNotificationRequest>({
      query: (notification) => ({
        url: "/notifications",
        method: "POST",
        body: notification,
      }),
      invalidatesTags: ["Notification", "NotificationStats"],
      async onQueryStarted(notification, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Schedule local notification using Expo Notifications
          if (data.success) {
            const notifyAt = new Date(notification.notifyAt);
            await notificationService.scheduleTaskReminder(
              notification.taskId,
              notification.title,
              notifyAt,
              notifyAt
            );
          }
        } catch (error) {
          console.error("Error scheduling local notification:", error);
        }
      },
    }),

    // Generate notifications for incomplete tasks
    generateTaskNotifications: builder.mutation<{ success: boolean; message: string; data: Notification[] }, void>({
      query: () => ({
        url: "/notifications/generate-task-notifications",
        method: "POST",
      }),
      invalidatesTags: ["Notification", "NotificationStats"],
    }),

    // Update notification
    updateNotification: builder.mutation<{ success: boolean; message: string; data: Notification }, { notificationId: string; updates: UpdateNotificationRequest }>({
      query: ({ notificationId, updates }) => ({
        url: `/notifications/${notificationId}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { notificationId }) => [
        { type: "Notification", id: notificationId },
        { type: "Notification", id: "LIST" },
        "NotificationStats",
      ],
    }),

    // Mark notification as sent
    markNotificationAsSent: builder.mutation<{ success: boolean; message: string; data: Notification }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/sent`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        "NotificationStats",
      ],
    }),

    // Delete notification
    deleteNotification: builder.mutation<{ success: boolean; message: string }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        "NotificationStats",
      ],
    }),

    // Bulk delete notifications
    bulkDeleteNotifications: builder.mutation<{ success: boolean; message: string }, string[]>({
      query: (notificationIds) => ({
        url: "/notifications/bulk/delete",
        method: "DELETE",
        body: { notificationIds },
      }),
      invalidatesTags: ["Notification", "NotificationStats"],
    }),

    // Initialize notification service
    initializeNotifications: builder.mutation<{ success: boolean; message: string; data?: any }, void>({
      queryFn: async () => {
        try {
          const result = await notificationService.initialize();
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to initialize notifications" } };
        }
      },
    }),

    // Schedule local task reminder
    scheduleTaskReminder: builder.mutation<
      { success: boolean; message: string; data?: any },
      { taskId: string; taskTitle: string; dueDate: Date; reminderTime: Date }
    >({
      queryFn: async ({ taskId, taskTitle, dueDate, reminderTime }) => {
        try {
          const result = await notificationService.scheduleTaskReminder(
            taskId,
            taskTitle,
            dueDate,
            reminderTime
          );
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to schedule task reminder" } };
        }
      },
    }),

    // Send immediate notification (for testing)
    sendImmediateNotification: builder.mutation<
      { success: boolean; message: string },
      { title: string; body: string; data?: any }
    >({
      queryFn: async ({ title, body, data }) => {
        try {
          const result = await notificationService.sendImmediateNotification(title, body, data);
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to send immediate notification" } };
        }
      },
    }),

    // Get scheduled notifications
    getScheduledNotifications: builder.query<{ success: boolean; message: string; data?: any }, void>({
      queryFn: async () => {
        try {
          const result = await notificationService.getScheduledNotifications();
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to get scheduled notifications" } };
        }
      },
    }),

    // Cancel notification
    cancelNotification: builder.mutation<{ success: boolean; message: string }, string>({
      queryFn: async (notificationId) => {
        try {
          const result = await notificationService.cancelNotification(notificationId);
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to cancel notification" } };
        }
      },
    }),

    // Cancel all notifications
    cancelAllNotifications: builder.mutation<{ success: boolean; message: string }, void>({
      queryFn: async () => {
        try {
          const result = await notificationService.cancelAllNotifications();
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to cancel all notifications" } };
        }
      },
    }),

    // Check notification permissions
    checkNotificationPermissions: builder.query<boolean, void>({
      queryFn: async () => {
        try {
          const result = await notificationService.areNotificationsEnabled();
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to check notification permissions" } };
        }
      },
    }),

    // Request notification permissions
    requestNotificationPermissions: builder.mutation<{ success: boolean; message: string }, void>({
      queryFn: async () => {
        try {
          const result = await notificationService.requestPermissions();
          return { data: result };
        } catch (error) {
          return { error: { status: 500, data: "Failed to request notification permissions" } };
        }
      },
    }),
  }),
});

// Export hooks
export const {
  useGetUserNotificationsQuery,
  useGetNotificationStatsQuery,
  useGetUpcomingNotificationsQuery,
  useGetNotificationQuery,
  useCreateNotificationMutation,
  useGenerateTaskNotificationsMutation,
  useUpdateNotificationMutation,
  useMarkNotificationAsSentMutation,
  useDeleteNotificationMutation,
  useBulkDeleteNotificationsMutation,
  useInitializeNotificationsMutation,
  useScheduleTaskReminderMutation,
  useSendImmediateNotificationMutation,
  useGetScheduledNotificationsQuery,
  useCancelNotificationMutation,
  useCancelAllNotificationsMutation,
  useCheckNotificationPermissionsQuery,
  useRequestNotificationPermissionsMutation,
} = notificationApi;

// Export reducer
export default notificationApi.reducer;
