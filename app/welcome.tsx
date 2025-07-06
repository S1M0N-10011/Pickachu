import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSignInUp = () => {
    router.push('/account');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Trainer!</Text>

      <Image
        source={require('../assets/images/welcome-background.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignInUp}>
        <Text style={styles.primaryButtonText}>Sign up for your journey</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Step into the Pokéworld</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2226',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#ffd33d',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 16,
    width: '80%',
  },
  primaryButtonText: {
    color: '#1f2226',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    borderWidth: 2,
    borderColor: '#ffd33d',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#ffd33d',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 1,
  },
});
