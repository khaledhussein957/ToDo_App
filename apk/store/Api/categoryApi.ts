import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

// Types
export interface Category {
  _id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  id: string;
  name: string;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  category?: Category;
  categories?: Category[];
}

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery,
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    // Create category
    createCategory: builder.mutation<CategoryResponse, CreateCategoryRequest>({
      query: (body) => ({
        url: "/category/create-category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),

    // Get all categories
    getAllCategories: builder.query<CategoryResponse, void>({
      query: () => "/category/get-all-categories",
      providesTags: ["Category"],
    }),

    // Update category
    updateCategory: builder.mutation<CategoryResponse, UpdateCategoryRequest>({
      query: ({ id, name }) => ({
        url: `/category/update-category/${id}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: ["Category"],
    }),

    // Delete category
    deleteCategory: builder.mutation<CategoryResponse, string>({
      query: (id) => ({
        url: `/category/delete-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useCreateCategoryMutation,
  useGetAllCategoriesQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
