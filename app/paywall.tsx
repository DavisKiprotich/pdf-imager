import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './LanguageContext';
import { useSubscription } from './SubscriptionContext';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const Container = styled(SafeAreaView)`flex: 1; background-color: #fff;`;
const Header = styled.View`padding: 16px 24px; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;`;
const CloseButton = styled.TouchableOpacity`padding: 8px;`;
const Content = styled.ScrollView`padding: 0 24px;`;
const HeroIcon = styled.View`width: 72px; height: 72px; background-color: #EEF2FF; border-radius: 20px; align-items: center; justify-content: center; align-self: center; margin-top: 40px; margin-bottom: 24px; overflow: hidden;`;
const Title = styled.Text`font-size: 28px; font-weight: 800; color: #1E293B; text-align: center; margin-bottom: 12px;`;
const Subtitle = styled.Text`font-size: 16px; color: #64748B; text-align: center; line-height: 24px; padding: 0 20px; margin-bottom: 40px;`;

const PlansColumn = styled.View`margin: 12px 0;`;

const PlanLabel = styled.Text`font-size: 16px; font-weight: 800; color: #1E293B; margin-bottom: 2px;`;
const PlanPrice = styled.Text`font-size: 17px; font-weight: 800; color: #1E293B;`;
const Badge = styled.View`background-color: #4F46E5; padding: 4px 8px; border-radius: 8px;`;
const BadgeText = styled.Text`color: #FFF; font-size: 10px; font-weight: 800; text-transform: uppercase;`;

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
  const { isSubscribed, conversionCount, isTrialStarted, subscribe, startTrial, offerings, isLoading: contextLoading, restorePurchases } = useSubscription();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const plans = useMemo(() => {
    if (offerings) {
      const list = [];
      if (offerings.weekly) list.push({ id: 'weekly' as const, pkg: offerings.weekly, label: t.weekly, subtitle: "Full features, weekly billing", price: offerings.weekly.product.priceString, period: 'weekly' });
      if (offerings.monthly) list.push({ id: 'monthly' as const, pkg: offerings.monthly, label: t.monthly, subtitle: "Most flexible plan", price: offerings.monthly.product.priceString, period: 'monthly' });
      if (offerings.annual) list.push({ id: 'annual' as const, pkg: offerings.annual, label: t.annual, subtitle: "Best value for power users", badge: t.bestValue, price: offerings.annual.product.priceString, period: 'yearly' });
      return list;
    }
    return [
      { id: 'weekly' as const, pkg: null, label: t.weekly, subtitle: "Full features, weekly billing", price: t.weeklyPrice, period: 'weekly' },
      { id: 'monthly' as const, pkg: null, label: t.monthly, subtitle: "Most flexible plan", price: t.monthlyPrice, period: 'monthly' },
      { id: 'annual' as const, pkg: null, label: t.annual, subtitle: "Best value for power users", badge: t.bestValue, price: t.annualPrice, period: 'yearly' },
    ];
  }, [offerings, t]);

  const PlanItem = ({ plan, selected, onSelect }: any) => {
    const scale = useSharedValue(1);
    const borderColor = useSharedValue(selected ? '#4F46E5' : '#F1F5F9');
    const backgroundColor = useSharedValue(selected ? '#F5F3FF' : '#FFF');

    useEffect(() => {
      scale.value = withSpring(selected ? 1.02 : 1);
      borderColor.value = withTiming(selected ? '#4F46E5' : '#F1F5F9');
      backgroundColor.value = withTiming(selected ? '#F5F3FF' : '#FFF');
    }, [selected]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      borderColor: borderColor.value,
      backgroundColor: backgroundColor.value,
    }));

    return (
      <TouchableOpacity onPress={onSelect} activeOpacity={0.9}>
        <Animated.View style={[animatedStyle, { 
          flexDirection: 'row', 
          alignItems: 'center', 
          borderWidth: 2, 
          borderRadius: 20, 
          padding: 16, 
          marginBottom: 12 
        }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <PlanLabel>{plan.label}</PlanLabel>
              {plan.badge && (
                <Badge style={{ marginLeft: 8 }}>
                  <BadgeText>{plan.badge}</BadgeText>
                </Badge>
              )}
            </View>
            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>{plan.subtitle}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <PlanPrice>{plan.price}</PlanPrice>
            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{plan.period}</Text>
          </View>
          {selected && (
            <View style={{ marginLeft: 16 }}>
              <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (offerings) {
      if (offerings.monthly) setSelectedPlan('monthly');
      else if (offerings.annual) setSelectedPlan('annual');
      else if (offerings.weekly) setSelectedPlan('weekly');
    }
  }, [offerings]);

  const currentPackage = useMemo(() => {
    if (!offerings) return null;
    if (selectedPlan === 'annual') return offerings.annual;
    if (selectedPlan === 'monthly') return offerings.monthly;
    if (selectedPlan === 'weekly') return offerings.weekly;
    return null;
  }, [offerings, selectedPlan]);

  const handleAction = async () => {
    if (!currentPackage) {
      Alert.alert("Mockup Plan", "This is a mockup plan. Connect to Play Console for real purchases.");
      return;
    }
    try {
      setIsPurchasing(true);
      await subscribe(currentPackage);
      if (!isTrialStarted) await startTrial();
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert("Error", "Transaction failed.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestoreAction = async () => {
    try {
      setIsPurchasing(true);
      await restorePurchases();
      if (isSubscribed) Alert.alert("Success", "Subscription restored.");
      else Alert.alert("Restored", "No active subscription found.");
    } catch (e) {
      Alert.alert("Error", "Could not restore.");
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
        <TouchableOpacity onPress={handleRestoreAction} disabled={isPurchasing} style={{ padding: 8 }}>
          <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 14, opacity: isPurchasing ? 0.5 : 1 }}>
            {t.restoreButton}
          </Text>
        </TouchableOpacity>
        <CloseButton onPress={() => startTrial()}>
          <Ionicons name="close" size={24} color="#94A3B8" />
        </CloseButton>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <HeroIcon>
          <View style={{ width: '100%', height: '100%', borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5' }}>
            <Ionicons name="shield-checkmark" size={32} color="#FFF" />
          </View>
        </HeroIcon>
        <Title>{t.premiumTitle}</Title>
        <Subtitle>{t.premiumSub}</Subtitle>

        <PlansColumn>
          {plans.map((p) => (
            <PlanItem key={p.id} plan={p} selected={selectedPlan === p.id} onSelect={() => setSelectedPlan(p.id)} />
          ))}
        </PlansColumn>

        <FeaturesList>
          <FeatureItem><Ionicons name="infinite" size={20} color="#10B981" /><FeatureText>{t.featUnlimited}</FeatureText></FeatureItem>
          <FeatureItem><Ionicons name="layers-outline" size={20} color="#10B981" /><FeatureText>{t.featBatch}</FeatureText></FeatureItem>
          <FeatureItem><Ionicons name="eye-off-outline" size={20} color="#10B981" /><FeatureText>{t.featNoAds}</FeatureText></FeatureItem>
        </FeaturesList>
      </Content>

      <Footer>
        <PrimaryButton onPress={handleAction} disabled={isPurchasing}>
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <PrimaryButtonText>
              {currentPackage ? t.subscribeFor.replace('{{price}}', currentPackage.product.priceString) : t.subscribeNow}
            </PrimaryButtonText>
          )}
        </PrimaryButton>
        
        {!isSubscribed && conversionCount < 3 && (
          <TouchableOpacity onPress={() => startTrial()} style={{ marginTop: 16, alignItems: 'center' }} disabled={isPurchasing}>
            <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 15 }}>{t.startTrial} ›</Text>
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
