// app/(tabs)/history.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, Platform, TouchableOpacity, RefreshControl } from "react-native";
import styled from "styled-components/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { useLanguage } from "../LanguageContext";

const Container = styled(SafeAreaView)`flex:1;background-color:#f8fafc;`;
const Header = styled.View`padding:20px 24px;`;
const Title = styled.Text`font-size:24px;font-weight:800;color:#1e293b;`;
const Section = styled.View`padding:12px 24px;`;
const FileRow = styled.TouchableOpacity`flex-direction:row;justify-content:space-between;align-items:center;padding:16px;background-color:#fff;margin-bottom:12px;border-radius:16px;border-width:1px;border-color:#f1f5f9;`;
const FileThumb = styled.View`width:48px;height:48px;margin-right:12px;border-radius:10px;align-items:center;justify-content:center;`;
const EmptyState = styled.View`flex:1;justify-content:center;align-items:center;padding-top:100px;`;

const APP_PDF_FOLDER = `${FileSystem.documentDirectory}pdfconverter/`;

export default function History() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFiles = async () => {
    try {
      const names = await FileSystem.readDirectoryAsync(APP_PDF_FOLDER);
      const infos = await Promise.all(names.map(async (name) => {
          const info = await FileSystem.getInfoAsync(`${APP_PDF_FOLDER}${name}`, { size: true } as any);
          return info.exists && !info.isDirectory ? { name, uri: info.uri, size: info.size, modificationTime: info.modificationTime } : null;
      }));
      setFiles(infos.filter(f => f !== null).sort((a,b) => (b.modificationTime || 0) - (a.modificationTime || 0)));
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { loadFiles(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }

  const openFile = async (uri: string) => {
    if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, flags: 1 });
    } else {
        await Sharing.shareAsync(uri);
    }
  }

  function formatBytes(bytes = 0) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = 1;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  return (
    <Container>
      <Header><Title>{t.history}</Title></Header>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        <Section>
           {files.length === 0 ? (
             <EmptyState>
               <Ionicons name="documents-outline" size={64} color="#CBD5E1" />
               <Text style={{ marginTop: 16, color: '#64748B', fontWeight: '600' }}>{t.noHistoryFiles}</Text>
             </EmptyState>
           ) : (
             files.map((file, idx) => (
               <FileRow key={idx} onPress={() => openFile(file.uri)}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <FileThumb style={{ backgroundColor: file.name.endsWith('.pdf') ? '#FEF2F2' : file.name.match(/\.(docx|doc)$/i) ? '#EFF6FF' : '#F0FDF4' }}>
                     {(() => {
                        if (file.name.endsWith('.pdf')) return <Ionicons name="document-text" size={24} color="#EF4444" />;
                        if (file.name.match(/\.(docx|doc)$/i)) return <Ionicons name="document" size={24} color="#2563EB" />;
                        return <Ionicons name="image" size={24} color="#22C55E" />;
                     })()}
                   </FileThumb>
                   <View>
                     <Text numberOfLines={1} style={{ fontWeight: '700', color: '#1E293B', maxWidth: 200 }}>{file.name}</Text>
                     <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{new Date(file.modificationTime * 1000).toLocaleDateString()} • {formatBytes(file.size)}</Text>
                   </View>
                 </View>
                 <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
               </FileRow>
             ))
           )}
        </Section>
      </ScrollView>
    </Container>
  );
}
