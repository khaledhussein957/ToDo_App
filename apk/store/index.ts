import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import todoReducer from "./slices/todoSlice";
import { authApi } from "./Api/authApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todoReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
