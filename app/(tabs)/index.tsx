import React, { useEffect, useState } from "react";
// Import Buffer for content URI handling
import { Buffer } from 'buffer';
import { View, Text, FlatList, ScrollView, Modal, TouchableOpacity, Alert, Platform, PermissionsAndroid, Share } from "react-native";
import styled from "styled-components/native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { locales } from "../../constants/locales";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
// use the legacy API to avoid the deprecation error for readAsStringAsync
import * as FileSystem from 'expo-file-system/legacy';

const theme = {
  colors: {
    primary: '#4caf50',
    textPrimary: '#000',
    background: '#ffffff',
  },
  spacing: {
    xs: '4',
    sm: '8',
    md: '16',
  },
  borderRadius: {
    sm: '8',
    md: '12',
  }
}

// ---------- Styled Components ----------
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #ffffff;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
`;

const RightIcons = styled.View`
  flex-direction: row;
  align-items: center;
`;

const IconButton = styled.TouchableOpacity`
  margin-left: 16px;
`;

const Title = styled.Text`
  font-size: 18px;
  font-weight: 600;
`;

const Section = styled.View`
  padding: 16px;
`;

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const Card = styled.TouchableOpacity`
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CardText = styled.Text`
  font-size: 14px;
`;

const FileRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

const QuickActionRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const QuickActionCard = styled.TouchableOpacity`
  width: 48%;
  background-color: #fafafa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  align-items: center;
`;

const StorageBar = styled.View`
  height: 10px;
  border-radius: 8px;
  background-color: #e0e0e0;
  margin-top: 8px;
  margin-bottom: 4px;
`;

const StorageFill = styled.View`
  height: 100%;
  border-radius: 8px;
  background-color: #4caf50;
  width: 70%; /* dynamically calculate */
`;

const BottomNav = styled.View`
  flex-direction: row;
  justify-content: space-around;
  border-top-width: 1px;
  border-top-color: #e0e0e0;
  padding: 12px 0;
  background-color: #ffffff;
`;

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  width: 80%;
`;

const LanguageItem = styled.TouchableOpacity`
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

// ---------- Main Dashboard ----------
export default function DashboardScreen() {
  const [locale, setLocale] = useState<keyof typeof locales>('en');
  const [modalVisible, setModalVisible] = useState(false);
  const t = locales[locale];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Mandarin Chinese' },
    { code: 'bn', name: 'Bengali' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
  ] as const;

  type RecentFile = {
    id: string;
    name: string;
    uri: string;
    size?: number; // bytes
    createdAt?: number;
  };

  const APP_PDF_FOLDER = `${FileSystem.documentDirectory}pdfconverter/`;
  const [recentFilesState, setRecentFilesState] = useState<RecentFile[]>([]);

  function formatBytes(bytes = 0) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async function ensureAppPdfFolderExists() {
    try {
      await FileSystem.makeDirectoryAsync(APP_PDF_FOLDER, { intermediates: true });
    } catch (err: any) {}
  }

  async function loadRecentFilesFromFolder() {
    try {
      await ensureAppPdfFolderExists();
      const names = await FileSystem.readDirectoryAsync(APP_PDF_FOLDER);
      const infos = await Promise.all(
        names.map(async (name) => {
          const uri = `${APP_PDF_FOLDER}${name}`;
          try {
            const info = await FileSystem.getInfoAsync(uri, { size: true });
            return {
              id: name + "-" + (info.modificationTime ?? Date.now()),
              name,
              uri,
              size: info.size ?? undefined,
              createdAt: info.modificationTime ?? Date.now(),
            } as RecentFile;
          } catch (e) {
            return {
              id: name + "-" + Date.now(),
              name,
              uri,
              size: undefined,
              createdAt: Date.now(),
            } as RecentFile;
          }
        })
      );
  
      infos.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setRecentFilesState(infos);
    } catch (e) {
      console.warn("loadRecentFilesFromFolder error", e);
    }
  }

  async function savePdfToAppFolderAndUpdateState(srcUri: string, filename?: string) {
    try {
      await ensureAppPdfFolderExists();
      const name = filename ?? `converted_${Date.now()}.pdf`;
      const dest = `${APP_PDF_FOLDER}${name}`;
  
      try {
        await FileSystem.copyAsync({ from: srcUri, to: dest });
      } catch (copyErr) {
        try {
          await FileSystem.moveAsync({ from: srcUri, to: dest });
        } catch (moveErr) {
          const base64 = await FileSystem.readAsStringAsync(srcUri, { encoding: "base64" });
          await FileSystem.writeAsStringAsync(dest, base64, { encoding: "base64" });
        }
      }
  
      const info = await FileSystem.getInfoAsync(dest, { size: true });
      const newFile: RecentFile = {
        id: `${name}-${info.modificationTime ?? Date.now()}`,
        name,
        uri: dest,
        size: info.size ?? undefined,
        createdAt: info.modificationTime ?? Date.now(),
      };
  
      setRecentFilesState((prev) => [newFile, ...prev.filter((f) => f.uri !== dest)]);
      return newFile;
    } catch (e) {
      console.error("savePdfToAppFolderAndUpdateState error", e);
      Alert.alert("Save error", "Could not save PDF to app folder.");
      return null;
    }
  }

  useEffect(() => {
    loadRecentFilesFromFolder();
  }, []);

  async function ensureFileUri(uri: string): Promise<string> {
    if (!uri.startsWith('content://')) return uri;

    try {
      const dest = `${FileSystem.cacheDirectory}tmp_${Date.now()}`;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      await FileSystem.writeAsStringAsync(dest, base64, { encoding: 'base64' });
      return dest;
    } catch (e) {
      console.warn('Could not copy content:// URI; trying direct use:', e);
      return uri;
    }
  }

  const convertUrisToPdf = async (imageUris: string[]): Promise<string | null> => {
    try {
      const imgTags = await Promise.all(
        imageUris.map(async (uri: string) => {
          if (!uri) throw new Error('Picked asset missing URI');
          const fileUri = await ensureFileUri(uri);
          const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
          const ext = fileUri.split('.').pop()?.toLowerCase() ?? 'jpg';
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          return `<div style="page-break-inside: avoid; margin-bottom: 8px;">
                    <img src="data:${mime};base64,${base64}" style="width:100%; height:auto; display:block;"/>
                  </div>`;
        })
      );

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page { size: auto; margin: 12mm; }
              img { max-width: 100%; height: auto; }
              .page { page-break-after: always; }
            </style>
          </head>
          <body>
            ${imgTags.map(tag => `<div class="page">${tag}</div>`).join('\n')}
          </body>
        </html>`;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      const saved = await savePdfToAppFolderAndUpdateState(pdfUri, `converted_${Date.now()}.pdf`);
      if (saved) {
        Alert.alert("PDF saved", `Saved to app folder: ${saved.name}\nSize: ${formatBytes(saved.size)}`);
      }
      return saved ? saved.uri : null;
    } catch (error: any) {
      console.error('Error in convertUrisToPdf:', error);
      Alert.alert('Expo PDF error', error?.message ?? String(error));
      return null;
    }
  };

  const handleSelectImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let mediaTypesOption: any;
      if ('MediaType' in ImagePicker) {
        mediaTypesOption = [ (ImagePicker as any).MediaType?.IMAGE ?? 'IMAGE' ];
      } else if ((ImagePicker as any).MediaTypeOptions) {
        mediaTypesOption = (ImagePicker as any).MediaTypeOptions.Images || (ImagePicker as any).MediaTypeOptions;
      } else {
        mediaTypesOption = 'Images';
      }

      const result: any = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesOption,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      const cancelled = !!(result?.canceled ?? result?.cancelled);
      if (cancelled) {
        console.log('Image picking cancelled');
        return;
      }

      let assets: any[] | undefined = result?.assets ?? result?.selected ?? result?.selectedAssets;
      if (!assets && result?.uri) {
        assets = [{ uri: result.uri }];
      }
      if (!assets || assets.length === 0) {
        console.warn('No images returned from picker', result);
        Alert.alert('No images selected');
        return;
      }

      const uris = assets.map((a: any) => a?.uri ?? a?.localUri ?? a?.fileUri).filter(Boolean);
      await convertUrisToPdf(uris);
    } catch (error: any) {
      console.error('Error in handleSelectImages:', error);
      Alert.alert('Image Selection error', error?.message ?? String(error));
    }
  };
  
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uris = result.assets.map(asset => asset.uri);
      await convertUrisToPdf(uris);
    } else {
      console.log("Camera cancelled or no asset returned");
    }
  };

  const handleSelectPdf = async () => {
    try {
      const docResult = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });

      if (docResult.canceled) {
        console.log("PDF picking cancelled");
        return;
      }
      
      if(docResult.assets && docResult.assets.length > 0) {
        const pdfUri = docResult.assets[0].uri;
        console.log("PDF selected:", pdfUri);
        Alert.alert('Not Supported', 'PDF to Image conversion is not supported in Expo Go.');
      }
      
    } catch (error: any) {
      console.error("Error in handleSelectPdf:", error);
      Alert.alert("PDF Selection error", error?.message ?? String(error));
    }
  };

  return (
    <Container>
      {/* Header */}
      <Header>
        <Title>{t.appName}</Title>
        <RightIcons>
          <IconButton onPress={() => setModalVisible(true)}>
            <Ionicons name="language" size={24} color="#000" />
          </IconButton>
          <IconButton onPress={() => alert("Profile")}>
            <MaterialIcons name="account-circle" size={28} color="#000" />
          </IconButton>
        </RightIcons>
      </Header>

      <ScrollView>
        {/* Conversion Type */}
        <Section>
          <SectionTitle>{t.chooseConversion}</SectionTitle>
          <Card onPress={handleSelectImages}>
            <CardText>{t.imagesToPdf}</CardText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: "#4CAF50", fontWeight: "600", marginRight: 8 }}>{t.selectImages}</Text>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleTakePhoto(); }}>
                <Feather name="camera" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </Card>
          <Card onPress={handleSelectPdf}>
            <CardText>{t.pdfToImages}</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>{t.selectPdf}</Text>
          </Card>
        </Section>

        {/* Recent Files */}
        <Section>
          <SectionTitle>{t.recentFiles}</SectionTitle>
          {recentFilesState.length === 0 ? (
            <Text style={{ color: "#666" }}>No recent files</Text>
          ) : (
            recentFilesState.map((file) => (
              <FileRow key={file.id}>
                <View>
                  <Text>{file.name}</Text>
                  <Text style={{ fontSize: 12, color: "#666" }}>{file.size ? formatBytes(file.size) : ""}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => {
                      Share.share({ url: file.uri })
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <Ionicons name="open-outline" size={20} color="#000" />
                  </TouchableOpacity>
                  <Ionicons name="share-social-outline" size={20} color="#000" />
                </View>
              </FileRow>
            ))
          )}
        </Section>

        {/* Quick Actions */}
        <Section>
          <SectionTitle>{t.quickActions}</SectionTitle>
          <QuickActionRow>
            <QuickActionCard>
              <Feather name="camera" size={24} color="#000" />
              <Text>{t.takePhoto}</Text>
            </QuickActionCard>
            <QuickActionCard>
              <Ionicons name="image-outline" size={24} color="#000" />
              <Text>{t.chooseImage}</Text>
            </QuickActionCard>
            <QuickActionCard>
              <MaterialIcons name="delete-outline" size={24} color="#000" />
              <Text>{t.removeFiles}</Text>
            </QuickActionCard>
            <QuickActionCard>
              <Ionicons name="time-outline" size={24} color="#000" />
              <Text>{t.history}</Text>
            </QuickActionCard>
          </QuickActionRow>
        </Section>

        {/* Storage */}
        <Section>
          <SectionTitle>{t.storageUsage}</SectionTitle>
          <StorageBar>
            <StorageFill />
          </StorageBar>
          <Text style={{ fontSize: 12, color: "#666" }}>437.0 MB / 1.0 GB</Text>
        </Section>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav>
        <Ionicons name="home-outline" size={24} color={theme.colors.textPrimary} />
        <Ionicons name="document-text-outline" size={24} color={theme.colors.textPrimary} />
        <Ionicons name="swap-horizontal-outline" size={24} color={theme.colors.textPrimary} />
        <Ionicons name="person-outline" size={24} color={theme.colors.textPrimary} />
      </BottomNav>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <ModalContainer>
          <ModalContent>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <LanguageItem
                  onPress={() => {
                    setLocale(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text>{item.name}</Text>
                </LanguageItem>
              )}
            />
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}
