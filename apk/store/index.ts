import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import todoReducer from "./slices/todoSlice";
import { authApi } from "./Api/authApi";
import { categoryApi } from "./Api/categoryApi";
import { userApi } from "./Api/userApi";
import { taskApi } from "./Api/taskApi";
import { analyticsApi } from "./Api/analyticsApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todoReducer,
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      categoryApi.middleware,
      userApi.middleware,
      taskApi.middleware,
      analyticsApi.middleware
    ),
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
