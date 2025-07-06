import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    // Alleen op Android: navigation bar automatisch verbergen (immersive)
    if (Platform.OS === 'android') {
      const hideNavBar = async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (e) {
          // fail silently
        }
      };
      hideNavBar();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          hideNavBar();
        }
      });
      return () => subscription.remove();
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="welcome" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="event-details"
        options={{
          title: 'Event Details',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="map-picker"
        options={{
          title: 'Pick Location',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="sort-picker"
        options={{
          title: 'Sort Events',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
