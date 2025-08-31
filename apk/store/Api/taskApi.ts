import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

// Types
export interface Task {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  category?: string;
  categoryId?: string | {
    _id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };
  priority?: "low" | "medium" | "high";
  tags?: string[];
  recurrence?: "Daily" | "Weekly" | "Monthly" | null;
  attachments?: string[];
  document?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  tags?: string; // JSON string for backend
  recurrence?: "Daily" | "Weekly" | "Monthly" | null;
  attachments?: Array<{
    uri: string;
    type: string;
    name: string;
  }>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  completed?: boolean;
  tags?: string; // JSON string for backend
  recurrence?: "Daily" | "Weekly" | "Monthly" | null;
  attachments?: Array<{
    uri: string;
    type: string;
    name: string;
  }>;
}

export interface TaskResponse {
  success: boolean;
  message: string;
  task?: Task;
  tasks?: Task[];
}

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery,
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    // Get all tasks
    getTasks: builder.query<TaskResponse, void>({
      query: () => "/task/get-tasks",
      providesTags: ["Task"],
    }),

    // Create new task
    createTask: builder.mutation<TaskResponse, CreateTaskRequest>({
      query: (body) => {
        // Check if we have attachments to upload
        if (body.attachments && body.attachments.length > 0) {
          // Create FormData for file upload
          const formData = new FormData();
          
          // Add text fields
          formData.append('title', body.title);
          if (body.description) formData.append('description', body.description);
          if (body.dueDate) formData.append('dueDate', body.dueDate);
          if (body.category) formData.append('category', body.category);
          if (body.priority) formData.append('priority', body.priority);
          if (body.tags) formData.append('tags', body.tags);
          if (body.recurrence) formData.append('recurrence', body.recurrence);
          
          // Add files
          body.attachments.forEach((file, index) => {
            formData.append('document', {
              uri: file.uri,
              type: file.type,
              name: file.name,
            } as any);
          });
          
          return {
            url: "/task/create-task",
            method: "POST",
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          };
        } else {
          // Send as JSON if no attachments
          const taskData = {
            title: body.title,
            description: body.description,
            dueDate: body.dueDate,
            category: body.category,
            priority: body.priority,
            tags: body.tags,
            recurrence: body.recurrence,
          };
          
          return {
            url: "/task/create-task",
            method: "POST",
            body: taskData,
          };
        }
      },
      invalidatesTags: ["Task"],
    }),

    // Update task
    updateTask: builder.mutation<TaskResponse, { id: string; body: UpdateTaskRequest }>({
      query: ({ id, body }) => {
        // Check if we have attachments to upload
        if (body.attachments && body.attachments.length > 0) {
          // Create FormData for file upload
          const formData = new FormData();
          
          // Add text fields
          if (body.title) formData.append('title', body.title);
          if (body.description) formData.append('description', body.description);
          if (body.dueDate) formData.append('dueDate', body.dueDate);
          if (body.category) formData.append('category', body.category);
          if (body.priority) formData.append('priority', body.priority);
          if (body.completed !== undefined) formData.append('completed', body.completed.toString());
          if (body.tags) formData.append('tags', body.tags);
          if (body.recurrence) formData.append('recurrence', body.recurrence);
          
          // Add files
          body.attachments.forEach((file, index) => {
            formData.append('document', {
              uri: file.uri,
              type: file.type,
              name: file.name,
            } as any);
          });
          
          return {
            url: `/task/update-task/${id}`,
            method: "PUT",
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          };
        } else {
          // Send as JSON if no attachments
          const taskData = {
            title: body.title,
            description: body.description,
            dueDate: body.dueDate,
            category: body.category,
            priority: body.priority,
            completed: body.completed,
            tags: body.tags,
            recurrence: body.recurrence,
          };
          
          return {
            url: `/task/update-task/${id}`,
            method: "PUT",
            body: taskData,
          };
        }
      },
      invalidatesTags: ["Task"],
    }),

    // Complete task
    completeTask: builder.mutation<TaskResponse, string>({
      query: (id) => ({
        url: `/task/complete-task/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Task"],
    }),

    // Delete task
    deleteTask: builder.mutation<TaskResponse, string>({
      query: (id) => ({
        url: `/task/delete-task/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Task"],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useCompleteTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
