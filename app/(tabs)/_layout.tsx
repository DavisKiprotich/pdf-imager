// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { useSubscription } from '../SubscriptionContext';

export default function TabLayout() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#94a3b8',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t.home,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t.history,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t.settings,
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({

});
