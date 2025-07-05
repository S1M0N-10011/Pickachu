import { Tabs } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: themeColors.tabIconSelected,
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerShadowVisible: false,
          headerTintColor: themeColors.text,
          tabBarStyle: {
            backgroundColor: themeColors.background,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account-circle' : 'account-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}
