// app/screens/PDFPreviewScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";

export default function PDFPreviewScreen({ route, navigation }: any) {
  const { uri, name } = route.params ?? {};

  if (!uri) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No file</Text>
      </SafeAreaView>
    );
  }

  async function openOrShare() {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        return;
      }
    } catch (e) {
      console.warn("sharing not available", e);
    }
    try {
      await Linking.openURL(uri);
    } catch (e) {
      Alert.alert("Cannot open file", String(e));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>{name ?? "PDF"}</Text>
        <Text style={{ color: "#666", textAlign: "center", marginBottom: 12 }}>
          In-app PDF preview requires a native viewer. Open or share the file to view it.
        </Text>
        <TouchableOpacity style={styles.button} onPress={openOrShare}>
          <Text style={{ color: "#fff" }}>Open / Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { height: 56, paddingHorizontal: 16, justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  button: { backgroundColor: "#4caf50", padding: 12, borderRadius: 8 },
});
