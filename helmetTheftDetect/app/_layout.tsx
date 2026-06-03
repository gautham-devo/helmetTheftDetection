import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        style="light"
        backgroundColor={Platform.OS === "android" ? "#000" : undefined}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
