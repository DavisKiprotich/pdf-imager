import React from "react";
import { View, Text, FlatList, ScrollView } from "react-native";
import styled from "styled-components/native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

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


// ---------- Main Dashboard ----------
export default function DashboardScreen() {
  const recentFiles = [
    { id: "1", name: "Document_2024.pdf", size: "1.2 MB" },
    { id: "2", name: "Photos_Collection.pdf", size: "3.8 MB" },
    { id: "3", name: "Page_001.jpg", size: "1.1 MB" }
  ];

  return (
    <Container>
      {/* Header */}
      <Header>
        <Title>PDF Converter</Title>
        <RightIcons>
          <IconButton onPress={() => alert("Change language")}>
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
          <SectionTitle>Choose Conversion Type</SectionTitle>
          <Card>
            <CardText>Images → PDF</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Select Images</Text>
          </Card>
          <Card>
            <CardText>PDF → Images</CardText>
            <Text style={{ color: "#4CAF50", fontWeight: "600" }}>Select PDF</Text>
          </Card>
        </Section>

        {/* Recent Files */}
        <Section>
          <SectionTitle>Recent Files</SectionTitle>
          {recentFiles.map((file) => (
            <FileRow key={file.id}>
              <View>
                <Text>{file.name}</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>{file.size}</Text>
              </View>
              <Ionicons name="share-social-outline" size={20} color="#000" />
            </FileRow>
          ))}
        </Section>

        {/* Quick Actions */}
        <Section>
          <SectionTitle>Quick Actions</SectionTitle>
          <QuickActionRow>
            <QuickActionCard>
              <Feather name="camera" size={24} color="#000" />
              <Text>Take Photo</Text>
            </QuickActionCard>
            <QuickActionCard>
              <Ionicons name="image-outline" size={24} color="#000" />
              <Text>Choose Image</Text>
            </QuickActionCard>
            <QuickActionCard>
              <MaterialIcons name="delete-outline" size={24} color="#000" />
              <Text>Remove Files</Text>
            </QuickActionCard>
            <QuickActionCard>
              <Ionicons name="time-outline" size={24} color="#000" />
              <Text>History</Text>
            </QuickActionCard>
          </QuickActionRow>
        </Section>

        {/* Storage */}
        <Section>
          <SectionTitle>Storage Usage</SectionTitle>
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
    </Container>
  );
}
