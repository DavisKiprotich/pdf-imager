// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  Linking,
  StyleSheet,
  FlatList,
} from "react-native";
import styled from "styled-components/native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { locales } from "../../constants/locales";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { CLOUDCONVERT_API_KEY } from "@env";

const Container = styled(SafeAreaView)`flex:1;background-color:#fff;`;
const Header = styled.View`flex-direction:row;justify-content:space-between;align-items:center;padding:16px;`;
const RightIcons = styled.View`flex-direction:row;align-items:center;`;
const IconButton = styled.TouchableOpacity`margin-left:16px;`;
const Title = styled.Text`font-size:18px;font-weight:600;`;
const Section = styled.View`padding:16px;`;
const SectionTitle = styled.Text`font-size:16px;font-weight:600;margin-bottom:12px;`;
const Card = styled.TouchableOpacity`background-color:#f9f9f9;padding:16px;border-radius:12px;margin-bottom:12px;flex-direction:row;justify-content:space-between;align-items:center;`;
const CardText = styled.Text`font-size:14px;`;
const FileRow = styled.TouchableOpacity`flex-direction:row;justify-content:space-between;align-items:center;padding:12px 0;border-bottom-width:1px;border-bottom-color:#f0f0f0;`;
const FileRowLeft = styled.View`flex-direction:row;align-items:center;`;
const FileThumb = styled.View`width:40px;height:50px;margin-right:8px;background-color:#f2f2f2;align-items:center;justify-content:center;`;
const QuickActionRow = styled.View`flex-direction:row;flex-wrap:wrap;justify-content:space-between;`;
const QuickActionCard = styled.TouchableOpacity`width:48%;background-color:#fafafa;padding:16px;border-radius:12px;margin-bottom:12px;align-items:center;`;
const BottomNav = styled.View`flex-direction:row;justify-content:space-around;border-top-width:1px;border-top-color:#e0e0e0;padding:12px 0;background-color:#fff;`;
const ModalContainer = styled.View`flex:1;justify-content:center;align-items:center;background-color:rgba(0,0,0,0.5);`;
const ModalContent = styled.View`background-color:#fff;padding:20px;border-radius:12px;width:90%;max-width:400px;`;
const OptionButton = styled.TouchableOpacity`padding:12px;border-radius:8px;margin-top:8px;align-items:center;`;
const LanguageItem = styled.TouchableOpacity`padding:15px;border-bottom-width:1px;border-bottom-color:#f0f0f0;`;

const PREFERRED_APPS: Record<
  string,
  { androidPackage?: string; iosScheme?: string; universalUrlSchemes?: string[] }
> = {
  wps: { androidPackage: "cn.wps.moffice_eng", iosScheme: "wps://" },
  adobe: { androidPackage: "com.adobe.reader", iosScheme: "acrobat://" },
  drive: { androidPackage: "com.google.android.apps.docs", iosScheme: "googledrive://" },
};

// ===== CLOUDCONVERT HELPERS =====

async function uploadToCloudConvert(uri, fileName) {
  const uploadResponse = await fetch("https://api.cloudconvert.com/v2/import/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` },
  });

  const uploadData = await uploadResponse.json();

  // ✅ Handle both new and old API response formats
  const formInfo = uploadData?.data?.result?.form || uploadData?.data?.form;
  if (!formInfo?.url) {
    console.log("Upload data:", uploadData);
    throw new Error("Invalid CloudConvert upload response. Check API key or plan.");
  }

  const uploadUrl = formInfo.url;
  const uploadParams = formInfo.parameters || {};

  const formData = new FormData();
  Object.keys(uploadParams).forEach((k) => formData.append(k, uploadParams[k]));
  formData.append("file", {
    uri,
    name: fileName,
    type: "application/octet-stream",
  });

  const res = await fetch(uploadUrl, { method: "POST", body: formData });
  if (!res.ok) throw new Error("File upload failed: " + res.statusText);

  return uploadData;
}

async function createConversionJob(inputOperation, fromType, toType) {
  const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDCONVERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tasks: {
        import_file: inputOperation,
        convert: {
          operation: "convert",
          input: "import_file",
          input_format: fromType,
          output_format: toType,
        },
        export_file: {
          operation: "export/url",
          input: "convert",
        },
      },
    }),
  });

  if (!jobResponse.ok) throw new Error("Failed to create job");
  return jobResponse.json();
}

async function fetchConvertedFile(jobId) {
  const response = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` },
  });
  const job = await response.json();
  const exportTask = job.data.tasks.find(
    (t) => t.operation === "export/url" && t.status === "finished"
  );
  const fileUrl = exportTask?.result?.files?.[0]?.url;
  if (!fileUrl) throw new Error("No converted file found");

  const ext = fileUrl.split(".").pop();
  const localUri = FileSystem.documentDirectory + `converted_${Date.now()}.${ext}`;
  await FileSystem.downloadAsync(fileUrl, localUri);

  return localUri;
}


async function promptOpenPdf(uri: string) {
  Alert.alert(
    "PDF Created",
    "Your PDF has been saved. Do you want to open it with another app?",
    [
      {
        text: "Dismiss",
        style: "cancel",
      },
      {
        text: "Open",
        onPress: async () => {
          try {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
              await Sharing.shareAsync(uri, {
                mimeType: "application/pdf",
                UTI: "com.adobe.pdf", // iOS compatibility
              });
            } else {
              Alert.alert("Not supported", "Opening with external apps is not available on this device.");
            }
          } catch (err) {
            console.error("Error opening PDF:", err);
            Alert.alert("Error", "Could not open the PDF.");
          }
        },
      },
    ]
  );
}

export default function DashboardScreen({ navigation }: any) {
  const [locale, setLocale] = useState<keyof typeof locales>("en");
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [fileOptionsVisible, setFileOptionsVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const t = locales[locale];

  const languages = [
    { code: "en", name: "English" }, { code: "fr", name: "French" }, { code: "hi", name: "Hindi" },
    { code: "ar", name: "Arabic" }, { code: "zh", name: "Mandarin Chinese" }, { code: "bn", name: "Bengali" },
    { code: "pt", name: "Portuguese" }, { code: "es", name: "Spanish" }, { code: "de", name: "German" },
  ] as const;

  type RecentFile = { id: string; name: string; uri: string; size?: number; createdAt?: number };

  const DOC_DIR = ((FileSystem as any).documentDirectory as string) ?? "";
  const CACHE_DIR = ((FileSystem as any).cacheDirectory as string) ?? DOC_DIR;
  const APP_PDF_FOLDER = `${DOC_DIR}pdfconverter/`;

  const [recentFilesState, setRecentFilesState] = useState<RecentFile[]>([]);

  useEffect(() => { loadRecentFilesFromFolder(); }, []);

  async function openWithChooser(uri: string) {
    if (!uri) {
      Alert.alert('File missing', 'No file URI available to open.');
      return;
    }

    if (Platform.OS === 'android' && (FileSystem as any).getContentUriAsync) {
      try {
        const contentUri = await (FileSystem as any).getContentUriAsync(uri);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(contentUri, { dialogTitle: 'Open with...' });
          return;
        }
        await Linking.openURL(contentUri);
        return;
      } catch (err) {
        console.warn('getContentUriAsync failed, falling back to shareAsync:', err);
      }
    }

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Open with...' });
        return;
      }
    } catch (err) {
      console.warn('expo-sharing failed:', err);
    }

    try {
      await Linking.openURL(uri);
    } catch (err) {
      console.error('Open fallback failed', err);
      Alert.alert('Open failed', 'No app could open this file.');
    }
  }

  function formatBytes(bytes = 0) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async function loadRecentFilesFromFolder() {
    try {
      await FileSystem.makeDirectoryAsync(APP_PDF_FOLDER, { intermediates: true });
      const names = await FileSystem.readDirectoryAsync(APP_PDF_FOLDER);
      const infos = await Promise.all(
        names.map(async (name: string) => {
          const uri = `${APP_PDF_FOLDER}${name}`;
          try {
            const info = await FileSystem.getInfoAsync(uri);
            const modTime = (info as any).modificationTime ?? Date.now();
            return { id: `${name}-${modTime}`, name, uri, size: (info as any).size, createdAt: modTime } as RecentFile;
          } catch {
            return { id: `${name}-${Date.now()}`, name, uri, createdAt: Date.now() } as RecentFile;
          }
        })
      );
      infos.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setRecentFilesState(infos);
    } catch (e) {
      console.warn("loadRecentFilesFromFolder error", e);
    }
  }

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    if (typeof Buffer !== "undefined") return Buffer.from(buffer).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    if (typeof (global as any).btoa === "function") return (global as any).btoa(binary);
    throw new Error("No base64 encoder available");
  }

  async function ensureFileUri(uri: string) {
    if (!uri || !uri.startsWith("content://")) return uri;
    try {
      const dest = `${CACHE_DIR}tmp_${Date.now()}.tmp`;
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' } as any);
      await FileSystem.writeAsStringAsync(dest, b64, { encoding: "base64" } as any);
      return dest;
    } catch (e) {
      console.warn("ensureFileUri failed, using original content uri", e);
      return uri;
    }
  }

  const convertUrisToPdf = async (imageUris: string[]) => {
    try {
      const imgTags = await Promise.all(
        imageUris.map(async (uri) => {
          if (!uri) throw new Error("Missing URI");
          const fileUri = await ensureFileUri(uri);
          const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: "base64" } as any);
          const ext = fileUri.split(".").pop()?.toLowerCase() ?? "jpg";
          const mime = ext === "png" ? "image/png" : "image/jpeg";
          return `<div style="page-break-inside: avoid; margin-bottom:8px;"><img src="data:${mime};base64,${base64}" style="width:100%;height:auto;display:block;"/></div>`;
        })
      );

      const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>@page{size:auto;margin:12mm;}img{max-width:100%;height:auto}.page{page-break-after:always;}</style></head><body>${imgTags.map((t) => `<div class="page">${t}</div>`).join("\n")}</body></html>`;
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      const name = `converted_${Date.now()}.pdf`;
      const dest = `${APP_PDF_FOLDER}${name}`;

      await FileSystem.moveAsync({ from: pdfUri, to: dest });

      const info = await FileSystem.getInfoAsync(dest);
      const newFile: RecentFile = {
        id: `${name}-${(info as any).modificationTime ?? Date.now()}`,
        name, uri: dest, size: (info as any).size, createdAt: (info as any).modificationTime ?? Date.now(),
      };

      setRecentFilesState((prev) => [newFile, ...prev.filter((f) => f.uri !== dest)]);
      
      promptOpenPdf(dest);

      return dest;
    } catch (e: any) {
      console.error("convertUrisToPdf error", e);
      Alert.alert("Conversion error", e?.message ?? String(e));
      return null;
    }
  };

  const handleSelectImages = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      const result: any = await ImagePicker.launchImageLibraryAsync({ mediaTypes: (ImagePicker as any).MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
      if (result.canceled) return;
      const uris = (result.assets ?? []).map((a: any) => a.uri).filter(Boolean);
      if (uris.length > 0) await convertUrisToPdf(uris);
    } catch (e: any) {
      Alert.alert("Image Selection error", e?.message ?? String(e));
    }
  };

  const handleTakePhoto = async () => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      const result: any = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        Alert.alert(
          "Convert to PDF",
          "Do you want to convert this photo to a PDF?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Convert",
              onPress: async () => {
                await convertUrisToPdf([uri]);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert("Camera error", err?.message ?? String(err));
    }
  };

  // CloudConvert PDF ↔ DOCX Conversion
const handleSelectPdf = async (direction = "pdfToWord") => {
  try {
    const pick = await DocumentPicker.getDocumentAsync({
      type: direction === "pdfToWord" ? "application/pdf" : [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
      ],
    });
    if (pick.canceled || !pick.assets?.length) return;

    const { uri, name } = pick.assets[0];
    const fromType = direction === "pdfToWord" ? "pdf" : "docx";
    const toType = direction === "pdfToWord" ? "docx" : "pdf";

    Alert.alert("Uploading...", "Please wait while the file uploads.");
    const upload = await uploadToCloudConvert(uri, name);

    Alert.alert("Converting...", `${fromType.toUpperCase()} → ${toType.toUpperCase()}`);
    const jobData = await createConversionJob(upload.data.result, fromType, toType);

    const jobId = jobData.data.id;
    Alert.alert("Processing...", "Waiting for conversion to complete.");

    // Poll the job status until it's done
    let convertedFile;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        convertedFile = await fetchConvertedFile(jobId);
        if (convertedFile) break;
      } catch (_) {}
    }

    if (!convertedFile) {
      Alert.alert("Timeout", "Conversion took too long or failed.");
      return;
    }

    Alert.alert("Conversion Complete", `Saved file to: ${convertedFile}`);
    await Sharing.shareAsync(convertedFile);

  } catch (err) {
    console.error("Conversion error:", err);
    Alert.alert("Error", err.message || "Failed to convert file.");
  }
};

  async function deleteFile(file: RecentFile) {
    try {
      await FileSystem.deleteAsync(file.uri, { idempotent: true });
      setRecentFilesState((prev) => prev.filter((f) => f.uri !== file.uri));
      Alert.alert("Deleted", `${file.name} removed.`);
    } catch (e) {
      Alert.alert("Delete failed", String(e));
    }
  }

  async function shareFile(uri: string, name: string) {
    try {
      await Sharing.shareAsync(uri, { dialogTitle: name });
    } catch (e) {
      Alert.alert("Share failed", String(e));
    }
  }

  function onTapFile(file: RecentFile) {
    setSelectedFile(file);
    setFileOptionsVisible(true);
  }

  async function onOpenPressed() {
    if (!selectedFile) return;
    setFileOptionsVisible(false);
    await openWithChooser(selectedFile.uri);
  }

  async function onSharePressed() {
    if (!selectedFile) return;
    setFileOptionsVisible(false);
await shareFile(selectedFile.uri, selectedFile.name);
  }

  function onDeletePressed() {
    if (!selectedFile) return;
    setFileOptionsVisible(false);
    Alert.alert("Delete", `Delete ${selectedFile.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteFile(selectedFile); setSelectedFile(null); } },
    ]);
  }

  return (
    <Container>
      <Header>
        <Title>{t.appName}</Title>
        <RightIcons>
          <IconButton onPress={() => setLangModalVisible(true)}><Ionicons name="language" size={24} color="#000" /></IconButton>
          <IconButton onPress={() => Alert.alert("Profile")}><MaterialIcons name="account-circle" size={28} color="#000" /></IconButton>
        </RightIcons>
      </Header>

      <ScrollView>
        <Section>
          <SectionTitle>{t.chooseConversion}</SectionTitle>
          <Card onPress={handleSelectImages}>
            <CardText>{t.imagesToPdf}</CardText>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#4CAF50", fontWeight: "600", marginRight: 8 }}>{t.selectImages}</Text>
              <TouchableOpacity onPress={(e)=>{e.stopPropagation(); handleTakePhoto();}}><Feather name="camera" size={24} color="#4CAF50" /></TouchableOpacity>
            </View>
          </Card>
          <Card onPress={() => handleSelectPdf("pdfToWord")}>
            <CardText>PDF to Word</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Select PDF</Text>
          </Card>
          <Card onPress={() => handleSelectPdf("wordToPdf")}>
            <CardText>Word to PDF</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Select Word</Text>
          </Card>
        </Section>

        <Section>
          <SectionTitle>{t.recentFiles}</SectionTitle>
          <View>
            {recentFilesState.length === 0 ? <Text style={{ color: "#666" }}>No recent files</Text> : recentFilesState.map((file) => (
              <FileRow key={file.id} onPress={() => onTapFile(file)}>
                <FileRowLeft>
                  <FileThumb><Text style={{ fontSize: 10 }}>PDF</Text></FileThumb>
                  <View>
                    <Text>{file.name}</Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>{file.size ? formatBytes(file.size) : ""}</Text>
                  </View>
                </FileRowLeft>
                <TouchableOpacity onPress={() => onTapFile(file)}><Ionicons name="ellipsis-horizontal" size={20} color="#000" /></TouchableOpacity>
              </FileRow>
            ))}
          </View>
        </Section>

        <Section>
          <SectionTitle>{t.quickActions}</SectionTitle>
          <QuickActionRow>
            <QuickActionCard onPress={handleTakePhoto}><Feather name="camera" size={24} color="#000" /><Text>{t.takePhoto}</Text></QuickActionCard>
            <QuickActionCard onPress={handleSelectImages}><Ionicons name="image-outline" size={24} color="#000" /><Text>{t.chooseImage}</Text></QuickActionCard>
          </QuickActionRow>
        </Section>
      </ScrollView>

      <BottomNav>
        <Ionicons name="home" size={24} color="#4caf50" /><Ionicons name="document-text-outline" size={24} color="#000" />
        <Ionicons name="swap-horizontal-outline" size={24} color="#000" /><Ionicons name="person-outline" size={24} color="#000" />
      </BottomNav>

      <Modal visible={fileOptionsVisible} transparent animationType="fade" onRequestClose={() => setFileOptionsVisible(false)}>
        <ModalContainer>
          <ModalContent>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }} numberOfLines={1}>{selectedFile?.name ?? "File"}</Text>

            <OptionButton onPress={onOpenPressed} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Open with...</Text></OptionButton>
            <OptionButton onPress={onSharePressed} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Share</Text></OptionButton>
            <OptionButton onPress={onDeletePressed} style={styles.dangerBtn}><Text style={styles.dangerBtnText}>Delete</Text></OptionButton>

            <OptionButton onPress={() => setFileOptionsVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></OptionButton>
          </ModalContent>
        </ModalContainer>
      </Modal>

      <Modal animationType="slide" transparent visible={langModalVisible} onRequestClose={() => setLangModalVisible(false)}>
        <ModalContainer><ModalContent>
          <FlatList data={languages} keyExtractor={(i: any) => i.code} renderItem={({ item }) => (
            <LanguageItem onPress={() => { setLocale(item.code as any); setLangModalVisible(false); }}><Text>{item.name}</Text></LanguageItem>
          )} />
        </ModalContent></ModalContainer>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  primaryBtn: { backgroundColor: "#4caf50", padding: 12, borderRadius: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  secondaryBtn: { backgroundColor: "#f2f2f2", padding: 12, borderRadius: 8, marginTop: 8 },
  secondaryBtnText: { color: "#000" },
  dangerBtn: { backgroundColor: "#f8d7da", padding: 12, borderRadius: 8, marginTop: 8 },
  dangerBtnText: { color: "#721c24" },
  cancelBtn: { marginTop: 8 },
});
