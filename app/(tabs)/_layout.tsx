// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { useSubscription } from '../SubscriptionContext';

export default function TabLayout() {
  const { t } = useLanguage();
  const { isSubscribed, conversionCount, isTrialStarted } = useSubscription();
  const router = useRouter();

  const isLimitReached = !isSubscribed && conversionCount >= 3;

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

      {/* Persistent Gate Overlay for non-subscribers at limit */}
      {isLimitReached && (
        <View style={StyleSheet.absoluteFillObject}>
           <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.7)', justifyContent: 'center', alignItems: 'center' }]}>
             <View style={styles.premiumGate}>
                <Ionicons name="lock-closed" size={48} color="#4F46E5" />
                <Text style={styles.gateTitle}>{t.premiumTitle}</Text>
                <Text style={styles.gateSub}>{t.premiumSub}</Text>
                <TouchableOpacity style={styles.gateButton} onPress={() => router.push("/paywall" as any)}>
                   <Text style={styles.gateButtonText}>{t.subscribeNow}</Text>
                </TouchableOpacity>
             </View>
           </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  premiumGate: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  gateSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  gateButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  gateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  }
});
