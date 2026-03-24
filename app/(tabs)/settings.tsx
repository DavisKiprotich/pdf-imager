// app/(tabs)/settings.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Share, Linking } from "react-native";
import styled from "styled-components/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../LanguageContext";
import * as FileSystem from "expo-file-system/legacy";

const Container = styled(SafeAreaView)`flex:1;background-color:#f8fafc;`;
const Header = styled.View`padding:20px 24px;`;
const Title = styled.Text`font-size:24px;font-weight:800;color:#1e293b;`;
const Section = styled.View`padding:12px 24px;`;
const SectionTitle = styled.Text`font-size:14px;font-weight:700;color:#94a3b8;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;`;
const SettingRow = styled.TouchableOpacity`flex-direction:row;align-items:center;padding:16px;background-color:#fff;margin-bottom:12px;border-radius:16px;border-width:1px;border-color:#f1f5f9;`;
const IconBox = styled.View`width:40px;height:40px;border-radius:10px;align-items:center;justify-content:center;margin-right:12px;`;
const Label = styled.Text`flex:1;font-weight:600;color:#1E293B;font-size:15px;`;

const APP_PDF_FOLDER = `${FileSystem.documentDirectory}pdfconverter/`;

export default function Settings() {
  const { t, locale } = useLanguage();

  const handleClearCache = async () => {
    Alert.alert(t.clearCache, "Are you sure? This will remove all temporary conversion files.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: async () => {
          try {
            await FileSystem.deleteAsync(APP_PDF_FOLDER, { idempotent: true });
            await FileSystem.makeDirectoryAsync(APP_PDF_FOLDER, { intermediates: true });
            Alert.alert("Success", "Cache cleared.");
          } catch (e) { Alert.alert("Error", String(e)); }
      }},
    ]);
  };

  const handleRestorePurchases = () => {
    Alert.alert(t.restorePurchases, "Attempting to restore purchases from your store account...");
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open link."));
  };

  return (
    <Container>
      <Header><Title>{t.settings}</Title></Header>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <Section>
          <SectionTitle>{t.manageSubscription}</SectionTitle>
          <SettingRow onPress={() => Alert.alert(t.manageSubscription, "Subscription management would open here.")}>
            <IconBox style={{ backgroundColor: '#F0F9FF' }}><Ionicons name="card-outline" size={20} color="#0EA5E9" /></IconBox>
            <Label>{t.manageSubscription}</Label>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </SettingRow>
          <SettingRow onPress={handleRestorePurchases}>
             <IconBox style={{ backgroundColor: '#F5F3FF' }}><Ionicons name="refresh-outline" size={20} color="#8B5CF6" /></IconBox>
             <Label>{t.restorePurchases}</Label>
             <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </SettingRow>
        </Section>

        <Section>
          <SectionTitle>{t.preferences}</SectionTitle>
          <SettingRow onPress={() => Alert.alert(t.appLanguage, "Use the language selector on the Home screen to change languages.")}>
            <IconBox style={{ backgroundColor: '#EEF2FF' }}><Ionicons name="language" size={20} color="#4F46E5" /></IconBox>
            <Label>{t.appLanguage}</Label>
            <Text style={{ color: '#94A3B8', marginRight: 8, fontSize: 13 }}>{locale.toUpperCase()}</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </SettingRow>
          <SettingRow onPress={handleClearCache}>
            <IconBox style={{ backgroundColor: '#FFF7ED' }}><Ionicons name="trash-outline" size={20} color="#F97316" /></IconBox>
            <Label>{t.clearCache}</Label>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </SettingRow>
        </Section>

        <Section>
          <SectionTitle>LEGAL</SectionTitle>
          <SettingRow onPress={() => openUrl("https://example.com/terms")}>
            <IconBox style={{ backgroundColor: '#F8FAFC' }}><Ionicons name="document-text-outline" size={20} color="#64748B" /></IconBox>
            <Label>{t.termsOfService}</Label>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </SettingRow>
          <SettingRow onPress={() => openUrl("https://example.com/privacy")}>
            <IconBox style={{ backgroundColor: '#F8FAFC' }}><Ionicons name="shield-checkmark-outline" size={20} color="#64748B" /></IconBox>
            <Label>{t.privacyPolicy}</Label>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </SettingRow>
        </Section>

        <Section>
          <SectionTitle>DANGER ZONE</SectionTitle>
          <SettingRow onPress={() => Alert.alert(t.deleteAppData, "This will reset all app settings and history. This action is irreversible.", [{ text: "Cancel" }, { text: "Delete", style: "destructive" }])}>
            <IconBox style={{ backgroundColor: '#FEF2F2' }}><Ionicons name="warning-outline" size={20} color="#EF4444" /></IconBox>
            <Label style={{ color: '#EF4444' }}>{t.deleteAppData}</Label>
          </SettingRow>
        </Section>

        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Build Version 1.0.0 (24)</Text>
          <Text style={{ color: '#CBD5E1', fontSize: 11, marginTop: 4 }}>© 2026 PDF Converter</Text>
        </View>

      </ScrollView>
    </Container>
  );
}
