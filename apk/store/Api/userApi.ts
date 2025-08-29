import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: FormData;
}

// For FormData uploads
export interface UpdateUserFormData extends FormData {}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Get user profile
    getUser: builder.query<UserResponse, void>({
      query: () => "/user/get-user",
      providesTags: ["User"],
    }),

    // Update user profile
    updateUser: builder.mutation<UserResponse, UpdateUserRequest | UpdateUserFormData>({
      query: (body) => ({
        url: "/user/update-user",
        method: "PUT",
        body,
        // Handle FormData for file uploads
        prepareHeaders: (headers: Headers) => {
          // Don't set Content-Type for FormData, let the browser set it
          return headers;
        },
      }),
      invalidatesTags: ["User"],
    }),

    // Update password
    updatePassword: builder.mutation<UserResponse, UpdatePasswordRequest>({
      query: (body) => ({
        url: "/user/update-password",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Delete user
    deleteUser: builder.mutation<UserResponse, void>({
      query: () => ({
        url: "/user/delete-user",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useUpdatePasswordMutation,
  useDeleteUserMutation,
} = userApi;
