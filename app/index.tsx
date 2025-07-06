import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function InitialScreen() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      router.replace('/welcome');
      if (hasSeenWelcome === 'false') { // temporarily inverted for testing, should be 'true'
        router.push('/(tabs)');
      }
    }
    check();
  }, []);

  return null;
}
