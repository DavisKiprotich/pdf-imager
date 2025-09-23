// app/(tabs)/_layout.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PDFPreviewScreen from '../screens/PDFPreviewScreen';
import DashboardScreen from './index';

const Stack = createNativeStackNavigator();

export default function TabLayout() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PDFPreview" component={PDFPreviewScreen} />
    </Stack.Navigator>
  );
}
