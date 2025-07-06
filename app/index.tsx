import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function InitialScreen() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcome === 'false') {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }
    check();
  }, []);

  return null;
}
