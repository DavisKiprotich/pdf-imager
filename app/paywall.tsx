// app/paywall.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './LanguageContext';
import { useSubscription } from './SubscriptionContext';

const Container = styled(SafeAreaView)`flex: 1; background-color: #fff;`;
const Header = styled.View`padding: 16px 24px; flex-direction: row; justify-content: flex-end; align-items: center;`;
const Content = styled.ScrollView`padding: 0 24px;`;
const HeroIcon = styled.View`width: 72px; height: 72px; background-color: #EEF2FF; border-radius: 20px; align-items: center; justify-content: center; align-self: center; margin-top: 40px; margin-bottom: 24px;`;
const Title = styled.Text`font-size: 28px; font-weight: 800; color: #1E293B; text-align: center; margin-bottom: 12px;`;
const Subtitle = styled.Text`font-size: 16px; color: #64748B; text-align: center; line-height: 24px; padding: 0 20px; margin-bottom: 40px;`;

const PlanCard = styled.TouchableOpacity<{ selected: boolean }>`
  background-color: ${(props: any) => props.selected ? '#F5F3FF' : '#FFF'};
  border-width: 2px;
  border-color: ${(props: any) => props.selected ? '#4F46E5' : '#F1F5F9'};
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const PlanDetails = styled.View`flex: 1;`;
const PlanLabel = styled.Text`font-size: 14px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;`;
const PlanPrice = styled.Text`font-size: 18px; font-weight: 800; color: #1E293B;`;
const Badge = styled.View`background-color: #4F46E5; padding: 4px 10px; border-radius: 100px;`;
const BadgeText = styled.Text`color: #FFF; font-size: 10px; font-weight: 800;`;

const FeaturesList = styled.View`margin-top: 24px; margin-bottom: 40px; border-top-width: 1px; border-top-color: #F1F5F9; padding-top: 24px;`;
const FeatureItem = styled.View`flex-direction: row; align-items: center; margin-bottom: 16px;`;
const FeatureText = styled.Text`font-size: 15px; color: #475569; margin-left: 12px; font-weight: 500;`;

const Footer = styled.View`padding: 24px; background-color: #fff; border-top-width: 1px; border-top-color: #F1F5F9;`;
const PrimaryButton = styled.TouchableOpacity`background-color: #4F46E5; padding: 18px; border-radius: 16px; align-items: center; shadow-color: #4F46E5; shadow-offset: 0px 4px; shadow-opacity: 0.3; shadow-radius: 10px; elevation: 8;`;
const PrimaryButtonText = styled.Text`color: #fff; font-size: 17px; font-weight: 700;`;
const SecondaryLinks = styled.View`flex-direction: row; justify-content: center; margin-top: 20px; gap: 20px;`;
const LinkText = styled.Text`font-size: 13px; color: #94A3B8; font-weight: 500; text-decoration-line: underline;`;
const LegalInfo = styled.Text`font-size: 12px; color: #CBD5E1; text-align: center; margin-top: 16px; line-height: 18px;`;

export default function Paywall() {
  const { t } = useLanguage();
  const { isTrialStarted, subscribe, startTrial } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'annual'>('annual');

  const handleAction = async () => {
    try {
      if (!isTrialStarted) {
        await startTrial();
      } else {
        await subscribe();
      }
      // No router needed - _layout.tsx will re-render automatically
    } catch (e) {
      Alert.alert("Error", "Transaction could not be completed.");
    }
  };

  return (
    <Container>
      <Header>
        <TouchableOpacity onPress={() => Linking.openURL('https://example.com/restore')}>
          <Text style={{ color: '#4F46E5', fontWeight: '700' }}>{t.restoreButton}</Text>
        </TouchableOpacity>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <HeroIcon><Ionicons name="shield-checkmark" size={32} color="#4F46E5" /></HeroIcon>
        <Title>{t.premiumTitle}</Title>
        <Subtitle>{t.premiumSub}</Subtitle>

        <PlanCard selected={selectedPlan === 'annual'} onPress={() => setSelectedPlan('annual')}>
          <PlanDetails><PlanLabel>{t.annual}</PlanLabel><PlanPrice>{t.annualPrice}</PlanPrice></PlanDetails>
          <Badge><BadgeText>{t.bestValue}</BadgeText></Badge>
        </PlanCard>

        <PlanCard selected={selectedPlan === 'monthly'} onPress={() => setSelectedPlan('monthly')}>
          <PlanDetails><PlanLabel>{t.monthly}</PlanLabel><PlanPrice>{t.monthlyPrice}</PlanPrice></PlanDetails>
          {selectedPlan === 'monthly' && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
        </PlanCard>

        <PlanCard selected={selectedPlan === 'weekly'} onPress={() => setSelectedPlan('weekly')}>
          <PlanDetails><PlanLabel>{t.weekly}</PlanLabel><PlanPrice>{t.weeklyPrice}</PlanPrice></PlanDetails>
          {selectedPlan === 'weekly' && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
        </PlanCard>

        <FeaturesList>
          <FeatureItem><Ionicons name="infinite" size={20} color="#10B981" /><FeatureText>{t.featUnlimited}</FeatureText></FeatureItem>
          <FeatureItem><Ionicons name="layers-outline" size={20} color="#10B981" /><FeatureText>{t.featBatch}</FeatureText></FeatureItem>
          <FeatureItem><Ionicons name="eye-off-outline" size={20} color="#10B981" /><FeatureText>{t.featNoAds}</FeatureText></FeatureItem>
        </FeaturesList>
      </Content>

      <Footer>
        <PrimaryButton onPress={handleAction}>
          <PrimaryButtonText>{!isTrialStarted ? t.startTrial : t.subscribeNow}</PrimaryButtonText>
        </PrimaryButton>
        <LegalInfo>{t.noCommitment}</LegalInfo>
        <SecondaryLinks>
          <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}><LinkText>{t.termsOfService}</LinkText></TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}><LinkText>{t.privacyPolicy}</LinkText></TouchableOpacity>
        </SecondaryLinks>
      </Footer>
    </Container>
  );
}
