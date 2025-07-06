import { Stack } from 'expo-router';

export default function RootLayout() {
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
