// app/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from "expo-file-system/legacy";

const ANALYTICS_FILE = `${FileSystem.documentDirectory}analytics.json`;

interface SubscriptionContextType {
  isSubscribed: boolean;
  conversionCount: number;
  isTrialStarted: boolean;
  isLanguageSelected: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  startTrial: () => Promise<void>;
  incrementCount: () => Promise<void>;
  markLanguageSelected: () => Promise<void>;
  isLimitReached: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [conversionCount, setConversionCount] = useState(0);
  const [isTrialStarted, setIsTrialStarted] = useState(false);
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(ANALYTICS_FILE);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(ANALYTICS_FILE);
          const data = JSON.parse(content);
          setIsSubscribed(data.isSubscribed || false);
          setConversionCount(data.count || 0);
          setIsTrialStarted(data.isTrialStarted || false);
          setIsLanguageSelected(data.isLanguageSelected || false);
        }
      } catch (e) { console.warn(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const save = async (updates: any) => {
     const info = await FileSystem.getInfoAsync(ANALYTICS_FILE);
     let current = { count: 0, isTrialStarted: false, isSubscribed: false, isLanguageSelected: false };
     if (info.exists) {
       current = JSON.parse(await FileSystem.readAsStringAsync(ANALYTICS_FILE));
     }
     const next = { ...current, ...updates };
     await FileSystem.writeAsStringAsync(ANALYTICS_FILE, JSON.stringify(next));
  }

  const subscribe = async () => {
    setIsSubscribed(true);
    await save({ isSubscribed: true });
  }

  const startTrial = async () => {
    setIsTrialStarted(true);
    await save({ isTrialStarted: true });
  }

  const incrementCount = async () => {
    const newCount = conversionCount + 1;
    setConversionCount(newCount);
    await save({ count: newCount });
  }

  const markLanguageSelected = async () => {
    setIsLanguageSelected(true);
    await save({ isLanguageSelected: true });
  }

  const isLimitReached = !isSubscribed && conversionCount >= 3;

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      conversionCount, 
      isTrialStarted, 
      isLanguageSelected,
      isLoading,
      subscribe, 
      startTrial, 
      incrementCount,
      markLanguageSelected,
      isLimitReached
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
}
