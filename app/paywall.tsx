// app/paywall.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './LanguageContext';
import { useSubscription } from './SubscriptionContext';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const Container = styled(SafeAreaView)`flex: 1; background-color: #fff;`;
const Header = styled.View`padding: 16px 24px; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;`;
const CloseButton = styled.TouchableOpacity`padding: 8px;`;
const Content = styled.ScrollView`padding: 0 24px;`;
const HeroIcon = styled.View`width: 72px; height: 72px; background-color: #EEF2FF; border-radius: 20px; align-items: center; justify-content: center; align-self: center; margin-top: 40px; margin-bottom: 24px;`;
const Title = styled.Text`font-size: 28px; font-weight: 800; color: #1E293B; text-align: center; margin-bottom: 12px;`;
const Subtitle = styled.Text`font-size: 16px; color: #64748B; text-align: center; line-height: 24px; padding: 0 20px; margin-bottom: 40px;`;

const PlanCard = styled.TouchableOpacity<{ selected: boolean }>`
  flex: 1;
  background-color: ${(props: any) => props.selected ? '#F5F3FF' : '#FFF'};
  border-width: 2px;
  border-color: ${(props: any) => props.selected ? '#4F46E5' : '#F1F5F9'};
  border-radius: 20px;
  padding: 16px 8px;
  margin: 0 4px;
  align-items: center;
  justify-content: center;
  min-height: 100px;
`;

const PlansRow = styled.View`flex-direction: row; justify-content: space-between; margin: 24px 0;`;

const PlanDetails = styled.View`align-items: center;`;
const PlanLabel = styled.Text`font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;`;
const PlanPrice = styled.Text`font-size: 16px; font-weight: 800; color: #1E293B; text-align: center;`;
const Badge = styled.View`background-color: #4F46E5; padding: 4px 8px; border-radius: 100px; position: absolute; top: -12px;`;
const BadgeText = styled.Text`color: #FFF; font-size: 9px; font-weight: 800;`;

const FeaturesList = styled.View`margin-top: 24px; margin-bottom: 40px; border-top-width: 1px; border-top-color: #F1F5F9; padding-top: 24px;`;
const FeatureItem = styled.View`flex-direction: row; align-items: center; margin-bottom: 16px;`;
const FeatureText = styled.Text`font-size: 15px; color: #475569; margin-left: 12px; font-weight: 500;`;

const Footer = styled.View`padding: 24px; background-color: #fff; border-top-width: 1px; border-top-color: #F1F5F9;`;
const PrimaryButton = styled.TouchableOpacity`background-color: #4F46E5; padding: 18px; border-radius: 16px; align-items: center; shadow-color: #4F46E5; shadow-offset: 0px 4px; shadow-opacity: 0.3; shadow-radius: 10px; elevation: 8;`;
const PrimaryButtonText = styled.Text`color: #fff; font-size: 17px; font-weight: 700;`;
const SecondaryLinks = styled.View`flex-direction: row; justify-content: center; margin-top: 20px; gap: 20px;`;
const LinkText = styled.Text`font-size: 13px; color: #94A3B8; font-weight: 500; text-decoration-line: underline;`;
const LegalInfo = styled.Text`font-size: 12px; color: #CBD5E1; text-align: center; margin-top: 16px; line-height: 18px;`;

const LoadingContainer = styled.View`flex: 1; justify-content: center; align-items: center; background-color: #fff;`;

export default function Paywall() {
  const { t } = useLanguage();
  const { isSubscribed, conversionCount, isTrialStarted, subscribe, startTrial, offerings, isLoading: contextLoading } = useSubscription();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Choose the first available plan as a default if monthly is missing
  React.useEffect(() => {
    if (offerings) {
      if (offerings.monthly) setSelectedPlan('monthly');
      else if (offerings.annual) setSelectedPlan('annual');
      else if (offerings.weekly) setSelectedPlan('weekly');
    }
  }, [offerings]);

  // Map RevenueCat packages to our local selection
  const currentPackage = useMemo(() => {
    if (!offerings) return null;
    if (selectedPlan === 'annual') return offerings.annual;
    if (selectedPlan === 'monthly') return offerings.monthly;
    if (selectedPlan === 'weekly') return offerings.weekly;
    return null;
  }, [offerings, selectedPlan]);

  const handleAction = async () => {
    if (!currentPackage) {
      Alert.alert("Subscription Unavailable", "We couldn't load the subscription plans. Please try again later.");
      return;
    }

    try {
      setIsPurchasing(true);
      await subscribe(currentPackage);
      // Trial tracking (internal only)
      if (!isTrialStarted) {
        await startTrial();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Error", "Transaction could not be completed.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleLocalTrial = async () => {
    await startTrial();
    router.replace("/(tabs)");
  };

  const restorePurchases = async () => {
    try {
      setIsPurchasing(true);
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['premium']) {
        Alert.alert("Success", "Your subscription has been restored.");
      } else {
        Alert.alert("Restored", "No active subscription found for your account.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not restore purchases.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (contextLoading && !offerings) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, color: '#64748B' }}>Loading products...</Text>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <TouchableOpacity onPress={restorePurchases} disabled={isPurchasing} style={{ padding: 8 }}>
          <Text 
            numberOfLines={1} 
            style={{ color: '#4F46E5', fontWeight: '700', fontSize: 14, opacity: isPurchasing ? 0.5 : 1 }}
          >
            {t.restoreButton}
          </Text>
        </TouchableOpacity>
        <CloseButton onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#94A3B8" />
        </CloseButton>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <HeroIcon><Ionicons name="shield-checkmark" size={32} color="#4F46E5" /></HeroIcon>
        <Title>{t.premiumTitle}</Title>
        <Subtitle>{t.premiumSub}</Subtitle>

        <PlansRow>
          {/* Weekly Plan */}
          {offerings?.weekly && (
            <PlanCard selected={selectedPlan === 'weekly'} onPress={() => setSelectedPlan('weekly')}>
              <PlanDetails>
                <PlanLabel>{t.weekly}</PlanLabel>
                <PlanPrice>{offerings.weekly.product.priceString}</PlanPrice>
              </PlanDetails>
            </PlanCard>
          )}

          {/* Monthly Plan */}
          {offerings?.monthly && (
            <PlanCard selected={selectedPlan === 'monthly'} onPress={() => setSelectedPlan('monthly')}>
               <PlanDetails>
                <PlanLabel>{t.monthly}</PlanLabel>
                <PlanPrice>{offerings.monthly.product.priceString}</PlanPrice>
              </PlanDetails>
            </PlanCard>
          )}

          {/* Annual Plan */}
          {offerings?.annual && (
            <PlanCard selected={selectedPlan === 'annual'} onPress={() => setSelectedPlan('annual')}>
              <Badge><BadgeText>{t.bestValue}</BadgeText></Badge>
              <PlanDetails>
                <PlanLabel>{t.annual}</PlanLabel>
                <PlanPrice>{offerings.annual.product.priceString}</PlanPrice>
              </PlanDetails>
            </PlanCard>
          )}
        </PlansRow>

        {!offerings && (
          <Text style={{ textAlign: 'center', color: '#EF4444', marginVertical: 20 }}>
            No active plans found. Please check your dashboard setup.
          </Text>
        )}

        <FeaturesList>
          <FeatureItem><Ionicons name="infinite" size={20} color="#10B981" /><FeatureText>{t.featUnlimited}</FeatureText></FeatureItem>
          <FeatureItem><Ionicons name="layers-outline" size={20} color="#10B981" /><FeatureText>{t.featBatch}</FeatureText></FeatureItem>
          <FeatureItem><Ionicons name="eye-off-outline" size={20} color="#10B981" /><FeatureText>{t.featNoAds}</FeatureText></FeatureItem>
        </FeaturesList>
      </Content>

      <Footer>
        <PrimaryButton onPress={handleAction} disabled={isPurchasing || !currentPackage}>
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <PrimaryButtonText>
              {currentPackage ? t.subscribeFor.replace('{{price}}', currentPackage.product.priceString) : t.subscribeNow}
            </PrimaryButtonText>
          )}
        </PrimaryButton>
        
        {!isSubscribed && conversionCount < 3 && (
          <TouchableOpacity 
            onPress={handleLocalTrial} 
            style={{ marginTop: 16, alignItems: 'center' }}
            disabled={isPurchasing}
          >
            <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 15 }}>
              {t.startTrial} ›
            </Text>
          </TouchableOpacity>
        )}

        <LegalInfo style={{ marginTop: 20 }}>{t.noCommitment}</LegalInfo>
        <SecondaryLinks>
          <TouchableOpacity onPress={() => Linking.openURL('https://daviskiprotich.github.io/pdf-imager.io/Terms/')}><LinkText>{t.termsOfService}</LinkText></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://daviskiprotich.github.io/pdf-imager.io/Privacy/')}><LinkText>{t.privacyPolicy}</LinkText></TouchableOpacity>
        </SecondaryLinks>
      </Footer>
    </Container>
  );
}
