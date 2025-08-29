import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "./BaseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Token and user management utilities
let storedToken: string | null = null;
let storedUser: any = null;

const getToken = async () => {
  const token = await AsyncStorage.getItem("token");
  storedToken = token || null;
  console.log("Token fetched:", storedToken);
  return storedToken;
};

// Synchronous version for baseQuery
const getTokenSync = () => {
  return storedToken;
};

const setToken = async (token: string) => {
  storedToken = token;
  await AsyncStorage.setItem("token", token);
  console.log("Token saved:", token);
};

const removeToken = async () => {
  storedToken = null;
  await AsyncStorage.removeItem("token");
  console.log("Token removed");
};

const getUser = async () => {
  const user = await AsyncStorage.getItem("user");
  storedUser = user ? JSON.parse(user) : null;
  console.log("User fetched:", storedUser);
  return storedUser;
};

const setUser = async (user: any) => {
  storedUser = user;
  await AsyncStorage.setItem("user", JSON.stringify(user));
  console.log("User saved:", user);
};

const removeUser = async () => {
  storedUser = null;
  await AsyncStorage.removeItem("user");
  console.log("User data cleared");
};

export const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  prepareHeaders: (headers) => {
    const token = getTokenSync();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
  validateStatus: (response) => {
    if (response.status === 401) {
      // Handle 401 synchronously - just clear memory
      storedToken = null;
      storedUser = null;
      console.log("Unauthorized - clearing stored data");
    }

    if (!response.ok) {
      return false;
    }

    return true;
  }
});

// Initialize stored data from AsyncStorage
const initializeStoredData = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    const user = await AsyncStorage.getItem("user");
    
    if (token) {
      storedToken = token;
      console.log("Token loaded from storage:", token);
    }
    
    if (user) {
      storedUser = JSON.parse(user);
      console.log("User loaded from storage:", storedUser);
    }
  } catch (error) {
    console.error("Error loading stored data:", error);
  }
};

// Check if user is logged in
const isLoggedIn = () => {
  return storedToken !== null && storedUser !== null;
};

// Export token and user management functions for external use
export const tokenUtils = {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  initializeStoredData,
  isLoggedIn
};
