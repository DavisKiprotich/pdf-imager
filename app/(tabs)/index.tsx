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

// ===== CLOUDCONVERT HELPERS (IMPROVED) =====

const CLOUDCONVERT_API = "https://api.cloudconvert.com/v2";

async function createConversionJob(payload: any) {
  // payload should be the jobs body (JSON)
  const url = `${CLOUDCONVERT_API}/jobs`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CLOUDCONVERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    console.error("CloudConvert create job failed:", res.status, json);
    // bubble up a helpful error including server body
    throw new Error(`Failed to create job (${res.status}): ${JSON.stringify(json)}`);
  }

  return json;
}

/**
 * Handles uploading a file according to the import task response.
 * It supports both `form` presigned upload and `url` direct upload shapes.
 */
async function uploadFileForJob(importTask: any, fileUri: string) {
  if (!importTask) throw new Error("Missing import task info");

  const formInfo = importTask.result?.form ?? null;

  if (formInfo && formInfo.url && formInfo.parameters) {
    // presigned form upload (S3 style)
    const formData = new FormData();
    Object.entries(formInfo.parameters).forEach(([k, v]) => {
      formData.append(k, v as any);
    });
    formData.append("file", {
      uri: fileUri,
      name: (fileUri.split("/").pop() || "upload.tmp"),
      type: "application/octet-stream", // Generic type
    } as any);

    const upRes = await fetch(formInfo.url, { method: "POST", body: formData });
    if (!upRes.ok) {
      const t = await upRes.text();
      console.error("Upload presigned failed:", upRes.status, t);
      throw new Error(`Upload failed: ${upRes.statusText || t}`);
    }
    return true;
  }

  const directUploadUrl = importTask.result?.url ?? null;
  if (directUploadUrl) {
    const fileData = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const upRes = await fetch(directUploadUrl, {
      method: "PUT",
      body: fileData, // The body for a PUT upload is just the file content
    });
    if (!upRes.ok) {
      const t = await upRes.text();
      console.error("Direct upload failed:", upRes.status, t);
      throw new Error(`Direct upload failed: ${upRes.statusText || t}`);
    }
    return true;
  }

  console.error("Unknown import task shape:", importTask);
  throw new Error("Unsupported import task shape from CloudConvert. See console for details.");
}


async function pollJobUntilFinished(jobId: string): Promise<any> {
  for (let i = 0; i < 20; i++) { // Poll for up to ~2 minutes
    const response = await fetch(`${CLOUDCONVERT_API}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` },
    });
    if (!response.ok) throw new Error("Failed to fetch job status");

    const job = await response.json();
    const jobStatus = job.data?.status;

    if (jobStatus === "finished") {
      return job;
    } else if (jobStatus === "error") {
      const failedTask = job.data.tasks.find(t => t.status === 'error');
      throw new Error(`Conversion failed: ${failedTask?.message || 'Unknown error'}`);
    }
    
    await new Promise((r) => setTimeout(r, 6000)); // Wait 6 seconds before next poll
  }
  throw new Error("Conversion timed out.");
}

async function downloadExportedFile(finishedJob: any): Promise<string> {
    const exportTask = finishedJob.data.tasks.find(
        (t: any) => t.operation === "export/url" && t.status === "finished"
    );
    const fileUrl = exportTask?.result?.files?.[0]?.url;
    if (!fileUrl) throw new Error("No converted file found in job result");

    const filename = exportTask?.result?.files?.[0]?.filename ?? `converted_${Date.now()}`;
    const localUri = FileSystem.documentDirectory + filename;
    
    await FileSystem.downloadAsync(fileUrl, localUri);
    return localUri;
}


async function promptOpenPdf(uri: string) {
  Alert.alert(
    "PDF Created",
    "Your PDF has been saved. Do you want to open it with another app?",
    [
      { text: "Dismiss", style: "cancel" },
      {
        text: "Open",
        onPress: async () => {
          try {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
            } else {
              Alert.alert("Not supported", "Sharing is not available on this device.");
            }
          } catch (err) {
            console.error("Error sharing PDF:", err);
            Alert.alert("Error", "Could not share the PDF.");
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

  const DOC_DIR = FileSystem.documentDirectory ?? "";
  const CACHE_DIR = FileSystem.cacheDirectory ?? DOC_DIR;
  const APP_PDF_FOLDER = `${DOC_DIR}pdfconverter/`;

  const [recentFilesState, setRecentFilesState] = useState<RecentFile[]>([]);

  useEffect(() => { loadRecentFilesFromFolder(); }, []);

  async function openWithChooser(uri: string) {
    if (!uri) return Alert.alert('File missing', 'No file URI available to open.');
    try {
        await Sharing.shareAsync(uri, { dialogTitle: 'Open with...' });
    } catch (err) {
        console.error('Sharing failed', err);
        try {
            await Linking.openURL(uri);
        } catch (linkErr) {
            console.error('Open fallback failed', linkErr);
            Alert.alert('Open failed', 'No app could open this file.');
        }
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
            const info = await FileSystem.getInfoAsync(uri, { size: true });
            return { id: `${name}-${info.modificationTime}`, name, uri, size: info.size, createdAt: info.modificationTime } as RecentFile;
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

  async function ensureFileUri(uri: string) {
    if (!uri || !uri.startsWith("content://")) return uri;
    try {
      const dest = `${CACHE_DIR}tmp_${Date.now()}.tmp`;
      await FileSystem.copyAsync({ from: uri, to: dest });
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
          const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
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

      const info = await FileSystem.getInfoAsync(dest, {size: true});
      const newFile: RecentFile = {
        id: `${name}-${info.modificationTime}`, name, uri: dest, size: info.size, createdAt: info.modificationTime,
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
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
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
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        Alert.alert("Convert to PDF", "Do you want to convert this photo to a PDF?", [
            { text: "Cancel", style: "cancel" },
            { text: "Convert", onPress: async () => { await convertUrisToPdf([uri]); } },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Camera error", err?.message ?? String(err));
    }
  };

  // REFACTORED CloudConvert PDF ↔ DOCX Conversion
  const handleSelectAndConvert = async (direction: "pdfToWord" | "wordToPdf") => {
    try {
      const fromType = direction === "pdfToWord" ? "pdf" : "docx";
      const toType = direction === "pdfToWord" ? "docx" : "pdf";

      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: fromType === 'pdf' ? 'application/pdf' : [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/msword', // .doc
        ]
      });

      // IMPORTANT: DocumentPicker returns { type: 'success'|'cancel', uri, name, size }
      if (pickerResult.type !== "success") return;
      const assetUri = pickerResult.uri;
      const assetName = pickerResult.name ?? `file_${Date.now()}`;

      // (1) Build the job payload
      const jobPayload = {
        "tasks": {
          "import-1": { "operation": "import/upload" },
          "convert-1": {
            "operation": "convert",
            "input": "import-1",
            "engine": "office",
            "output_format": toType,
          },
          "export-1": { "operation": "export/url", "input": "convert-1" },
        }
      };

      Alert.alert("Creating conversion job...", "Please wait.");
      const job = await createConversionJob(jobPayload);
      const importTask = job.data.tasks.find((t: any) => t.name === 'import-1' || t.operation === 'import/upload');
      if (!importTask) throw new Error("Missing import task from CloudConvert response");

      // (2) Upload file for the job
      Alert.alert("Uploading file...", assetName);
      const fileUri = await ensureFileUri(assetUri);
      await uploadFileForJob(importTask, fileUri);

      // (3) Poll, download, save & share
      Alert.alert("Processing file...", "This may take a moment.");
      const finishedJob = await pollJobUntilFinished(job.data.id);
      Alert.alert("Downloading converted file...");
      const localFileUri = await downloadExportedFile(finishedJob);

      await loadRecentFilesFromFolder();
      Alert.alert("Success!", `File converted and saved.`);
      await Sharing.shareAsync(localFileUri, { dialogTitle: 'Share your converted file' });

    } catch (err: any) {
      console.error("Conversion failed:", err);
      Alert.alert("Conversion Error", err.message || String(err));
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
          <Card onPress={() => handleSelectAndConvert("pdfToWord")}>
            <CardText>PDF to Word</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Select PDF</Text>
          </Card>
          <Card onPress={() => handleSelectAndConvert("wordToPdf")}>
            <CardText>Word to PDF</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Select Word</Text>
          </Card>
        </Section>

        <Section>
          <SectionTitle>{t.recentFiles}</SectionTitle>
          <View>
            {recentFilesState.length === 0 ? (
              <Text style={{ color: "#666" }}>No recent files</Text>
            ) : (
              recentFilesState.map((file) => (
                <FileRow key={file.id} onPress={() => onTapFile(file)}>
                  <FileRowLeft>
                    <FileThumb><Text style={{ fontSize: 10 }}>{file.name.split('.').pop()?.toUpperCase()}</Text></FileThumb>
                    <View>
                      <Text numberOfLines={1} style={{ maxWidth: 250 }}>{file.name}</Text>
                      <Text style={{ fontSize: 12, color: "#666" }}>{file.size ? formatBytes(file.size) : ""}</Text>
                    </View>
                  </FileRowLeft>
                  <TouchableOpacity onPress={() => onTapFile(file)}><Ionicons name="ellipsis-horizontal" size={20} color="#000" /></TouchableOpacity>
                </FileRow>
              ))
            )}
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
