import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import {
  useInitializeNotificationsMutation,
  useScheduleTaskReminderMutation,
  useSendImmediateNotificationMutation,
  useCheckNotificationPermissionsQuery,
  useRequestNotificationPermissionsMutation,
} from '../store/Api/notificationApi';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Notification API hooks
  const [initializeNotifications] = useInitializeNotificationsMutation();
  const [scheduleTaskReminder] = useScheduleTaskReminderMutation();
  const [sendImmediateNotification] = useSendImmediateNotificationMutation();
  const { data: permissionsEnabled } = useCheckNotificationPermissionsQuery();
  const [requestPermissions] = useRequestNotificationPermissionsMutation();

  // Initialize notifications
  const initialize = async () => {
    try {
      await initializeNotifications().unwrap();
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return { success: false, error };
    }
  };

  // Schedule a task reminder
  const scheduleReminder = async (
    taskId: string,
    taskTitle: string,
    dueDate: Date,
    reminderTime: Date
  ) => {
    try {
      await scheduleTaskReminder({
        taskId,
        taskTitle,
        dueDate,
        reminderTime,
      }).unwrap();
      return { success: true };
    } catch (error) {
      console.error('Failed to schedule task reminder:', error);
      return { success: false, error };
    }
  };

  // Send immediate notification
  const sendNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      await sendImmediateNotification({ title, body, data }).unwrap();
      return { success: true };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return { success: false, error };
    }
  };

  // Request permissions
  const requestNotificationPermissions = async () => {
    try {
      await requestPermissions().unwrap();
      return { success: true };
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return { success: false, error };
    }
  };

  // Handle notification received (simplified)
  const handleNotificationReceived = (notification: any) => {
    console.log('Notification received (backend only):', notification);
    // You can add custom logic here, like updating UI or showing a toast
  };

  // Handle notification response (simplified)
  const handleNotificationResponse = (response: any) => {
    const { data } = response?.notification?.request?.content || {};
    
    console.log('Notification response (backend only):', response);
    
    // Handle different notification types
    if (data?.type === 'task-reminder') {
      // Navigate to task details
      if (data.taskId) {
        router.push(`/task/${data.taskId}`);
      }
    } else if (data?.type === 'urgent') {
      // Handle urgent notification
      console.log('Urgent notification clicked:', data);
    }
  };

  // Set up notification listeners (simplified)
  useEffect(() => {
    // Set up simplified notification listeners
    const cleanup = notificationService.setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    // Cleanup listeners on unmount
    return cleanup;
  }, []);

  // Initialize notifications on mount
  useEffect(() => {
    initialize();
  }, []);

  return {
    // State
    permissionsEnabled,
    
    // Functions
    initialize,
    scheduleReminder,
    sendNotification,
    requestNotificationPermissions,
    
    // Service methods (for advanced usage)
    service: notificationService,
  };
};

// Hook for task-specific notifications
export const useTaskNotifications = (taskId?: string) => {
  const { scheduleReminder, sendNotification } = useNotifications();

  const scheduleTaskReminder = async (
    taskTitle: string,
    dueDate: Date,
    reminderTime: Date
  ) => {
    if (!taskId) {
      console.error('Task ID is required to schedule reminder');
      return { success: false, error: 'Task ID is required' };
    }

    return await scheduleReminder(taskId, taskTitle, dueDate, reminderTime);
  };

  const sendTaskNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    const notificationData = {
      ...data,
      taskId,
      type: 'task-notification',
    };

    return await sendNotification(title, body, notificationData);
  };

  return {
    scheduleTaskReminder,
    sendTaskNotification,
  };
};

// Hook for quick notification actions
export const useQuickNotifications = () => {
  const { sendNotification } = useNotifications();

  const showSuccessNotification = (message: string) => {
    return sendNotification('Success', message, { type: 'success' });
  };

  const showErrorNotification = (message: string) => {
    return sendNotification('Error', message, { type: 'error' });
  };

  const showInfoNotification = (title: string, message: string) => {
    return sendNotification(title, message, { type: 'info' });
  };

  const showTaskCompletedNotification = (taskTitle: string) => {
    return sendNotification(
      'Task Completed!',
      `Great job! You've completed "${taskTitle}"`,
      { type: 'task-completed' }
    );
  };

  const showTaskOverdueNotification = (taskTitle: string) => {
    return sendNotification(
      'Task Overdue',
      `"${taskTitle}" is overdue. Please complete it soon!`,
      { type: 'task-overdue' }
    );
  };

  return {
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification,
    showTaskCompletedNotification,
    showTaskOverdueNotification,
  };
};
