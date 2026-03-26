// app/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from "expo-file-system/legacy";
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

const ANALYTICS_FILE = `${FileSystem.documentDirectory}analytics.json`;
const APP_FOLDER = `${FileSystem.documentDirectory}pdfconverter/`;

const REVENUECAT_ANDROID_API_KEY = 'goog_sFucqcKKJdYAYxhIzyWoQggYaVJ';
const REVENUECAT_IOS_API_KEY = 'YOUR_IOS_API_KEY_HERE';

interface SubscriptionContextType {
  isSubscribed: boolean;
  conversionCount: number;
  isTrialStarted: boolean;
  isLanguageSelected: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  subscribe: (pkg: PurchasesPackage) => Promise<void>;
  startTrial: () => Promise<void>;
  incrementCount: () => Promise<void>;
  markLanguageSelected: () => Promise<void>;
  resetAllData: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  isLimitReached: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [conversionCount, setConversionCount] = useState(0);
  const [isTrialStarted, setIsTrialStarted] = useState(false);
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  const saveLocal = async (updates: any) => {
    try {
      const info = await FileSystem.getInfoAsync(ANALYTICS_FILE);
      let next = { count: 0, isTrialStarted: false, isSubscribed: false, isLanguageSelected: false };
      if (info.exists) {
        const current = JSON.parse(await FileSystem.readAsStringAsync(ANALYTICS_FILE));
        next = { ...current, ...updates };
      } else {
        next = { ...next, ...updates };
      }
      await FileSystem.writeAsStringAsync(ANALYTICS_FILE, JSON.stringify(next));
    } catch (e) {}
  };

  const updateEntitlementStatus = useCallback(async (info: CustomerInfo) => {
    const hasPremium = info.entitlements.active['premium'] !== undefined;
    setIsSubscribed(hasPremium);
    await saveLocal({ isSubscribed: hasPremium });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        // 1. Initial Local State
        const info = await FileSystem.getInfoAsync(ANALYTICS_FILE);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(ANALYTICS_FILE);
          const data = JSON.parse(content);
          if (isMounted) {
            setConversionCount(data.count || 0);
            setIsTrialStarted(data.isTrialStarted || false);
            setIsLanguageSelected(data.isLanguageSelected || false);
            setIsSubscribed(data.isSubscribed || false);
          }
        }

        // 2. RevenueCat Security
        if (Purchases && typeof Purchases.configure === 'function') {
           if (Platform.OS === 'android') {
             Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
           } else if (Platform.OS === 'ios' && REVENUECAT_IOS_API_KEY !== 'YOUR_IOS_API_KEY_HERE') {
             Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
           }

           const customerInfo = await Purchases.getCustomerInfo();
           if (isMounted) await updateEntitlementStatus(customerInfo);

           Purchases.addCustomerInfoUpdateListener(async (info) => {
             if (isMounted) await updateEntitlementStatus(info);
           });

           const currentOfferings = await Purchases.getOfferings();
           if (isMounted && currentOfferings.current) {
             setOfferings(currentOfferings.current);
           }
        }
      } catch (e) {
        console.warn('Subscription init silent fail:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();
    return () => { isMounted = false; };
  }, [updateEntitlementStatus]);

  const subscribe = useCallback(async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await updateEntitlementStatus(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) throw e;
    }
  }, [updateEntitlementStatus]);

  const startTrial = useCallback(async () => {
    setIsTrialStarted(true);
    await saveLocal({ isTrialStarted: true });
  }, []);

  const incrementCount = useCallback(async () => {
    setConversionCount(prev => {
      const next = prev + 1;
      saveLocal({ count: next }); // This is called within a functional update, so we just trigger it.
      return next;
    });
  }, []);

  const markLanguageSelected = useCallback(async () => {
    setIsLanguageSelected(true);
    await saveLocal({ isLanguageSelected: true });
  }, []);

  const resetAllData = useCallback(async () => {
    try {
      await FileSystem.deleteAsync(ANALYTICS_FILE, { idempotent: true });
      setIsSubscribed(false);
      setConversionCount(0);
      setIsTrialStarted(false);
      setIsLanguageSelected(false);
    } catch (e) {}
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      updateEntitlementStatus(info);
    } catch (e) {
      console.warn('Restore purchases failed:', e);
      throw e;
    }
  }, [updateEntitlementStatus]);

  const isLimitReached = !isSubscribed && conversionCount >= 3;

  const contextValue = useMemo(() => ({
    isSubscribed, conversionCount, isTrialStarted, isLanguageSelected,
    isLoading, offerings, subscribe, startTrial, incrementCount,
    markLanguageSelected, resetAllData, restorePurchases, isLimitReached
  }), [isSubscribed, conversionCount, isTrialStarted, isLanguageSelected, isLoading, offerings, subscribe, startTrial, incrementCount, markLanguageSelected, resetAllData, restorePurchases, isLimitReached]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
}

export default SubscriptionProvider;
