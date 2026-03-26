// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from './LanguageContext';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';
import OnboardingLanguage from './onboarding-language';
import Paywall from './paywall';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const sub = useSubscription();

  // 1. Show loading while reading persisted state from disk
  if (sub.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // 2. Flow: Native Splash → Language Selector → App Gated by Paywall
  // Gate 1: Language not selected → show language picker
  if (!sub.isLanguageSelected) {
    return <OnboardingLanguage />;
  }

  // Gate 2: No trial OR limit reached → show paywall
  // (We return the component directly here for gating)
  if (!sub.isTrialStarted || sub.isLimitReached) {
    return <Paywall />;
  }

  // Gate 3: All clear → show the main app
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <SubscriptionProvider>
        <RootLayoutNav />
      </SubscriptionProvider>
    </LanguageProvider>
  );
}
