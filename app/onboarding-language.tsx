// app/onboarding-language.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './LanguageContext';
import { useSubscription } from './SubscriptionContext';

const Container = styled(SafeAreaView)`flex: 1; background-color: #fff;`;
const Header = styled.View`padding: 24px; margin-top: 20px;`;
const Title = styled.Text`font-size: 28px; font-weight: 800; color: #1E293B; letter-spacing: -0.5px;`;
const Subtitle = styled.Text`font-size: 16px; color: #64748B; margin-top: 8px; line-height: 24px;`;
const Content = styled.ScrollView`padding: 0 24px;`;

const LanguageCard = styled.TouchableOpacity<{ selected: boolean }>`
  background-color: ${(props: any) => props.selected ? '#F5F3FF' : '#FFF'};
  border-width: 2px;
  border-color: ${(props: any) => props.selected ? '#4F46E5' : '#F1F5F9'};
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const LangInfo = styled.View`flex-direction: row; align-items: center;`;
const Flag = styled.Text`font-size: 32px; margin-right: 16px;`;
const LangName = styled.Text`font-size: 17px; font-weight: 700; color: #1E293B;`;

const Footer = styled.View`padding: 24px; background-color: #fff; border-top-width: 1px; border-top-color: #F1F5F9;`;
const NextButton = styled.TouchableOpacity`background-color: #4F46E5; padding: 18px; border-radius: 16px; align-items: center; shadow-color: #4F46E5; shadow-offset: 0px 4px; shadow-opacity: 0.3; shadow-radius: 10px; elevation: 8;`;
const ButtonText = styled.Text`color: #fff; font-size: 17px; font-weight: 700;`;

export default function OnboardingLanguage() {
  const { locale, setLocale, t } = useLanguage();
  const { markLanguageSelected } = useSubscription();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
  ];

  const handleNext = async () => {
    await markLanguageSelected();
    // No router needed - _layout.tsx will re-render automatically
  };

  return (
    <Container>
      <Header>
        <Title>{t.selectLanguageTitle}</Title>
        <Subtitle>{t.selectLanguageSub}</Subtitle>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        {languages.map((lang) => (
          <LanguageCard 
            key={lang.code} 
            selected={locale === lang.code} 
            onPress={() => setLocale(lang.code as any)}
          >
            <LangInfo>
              <Flag>{lang.flag}</Flag>
              <LangName>{lang.name}</LangName>
            </LangInfo>
            {locale === lang.code && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
          </LanguageCard>
        ))}
      </Content>

      <Footer>
        <NextButton onPress={handleNext}>
          <ButtonText>{t.continueButton}</ButtonText>
        </NextButton>
      </Footer>
    </Container>
  );
}
