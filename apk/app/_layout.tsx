import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store } from "../store";
import { useEffect } from "react";
import { tokenUtils } from "../store/Api/baseQuery";
import { useRouter } from "expo-router";

function AppContent() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      await tokenUtils.initializeStoredData();
      const isLoggedIn = tokenUtils.isLoggedIn();
      
      if (isLoggedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)");
      }
    };

    checkAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <StatusBar style="auto" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
