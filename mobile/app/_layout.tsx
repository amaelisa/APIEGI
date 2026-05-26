import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="home" />
      <Stack.Screen name="chat/[matiereId]" />
    </Stack>
  );
}

export default function RootLayout() {
  const hiddenRef = useRef(false);

  const hideSplash = () => {
    if (!hiddenRef.current) {
      hiddenRef.current = true;
      SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    // Délai maximum de 3 secondes — la splash se cache quoi qu'il arrive
    const timer = setTimeout(hideSplash, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={hideSplash}>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
