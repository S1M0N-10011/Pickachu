import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebase';

export default function AccountScreen() {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState(null);

  const actionCodeSettings = {
    url: "https://auth.cartigotcg.nl/emailSignIn",
    handleCodeInApp: true,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (isSignInWithEmailLink(auth, url)) {
        let savedEmail = await SecureStore.getItemAsync('emailForSignIn');
        if (!savedEmail) {
          Alert.prompt(
            'Enter your email',
            'Please enter your email to complete sign-in',
            async (inputEmail) => {
              if (inputEmail) {
                savedEmail = inputEmail;
                try {
                  await signInWithEmailLink(auth, savedEmail, url);
                  setUserEmail(savedEmail);
                  Alert.alert('Signed in!', `Welcome ${savedEmail}`);
                  await SecureStore.deleteItemAsync('emailForSignIn');
                } catch (error) {
                  Alert.alert('Sign-in error', error.message);
                }
              }
            },
            'plain-text',
            savedEmail || ''
          );
        } else {
          try {
            await signInWithEmailLink(auth, savedEmail, url);
            setUserEmail(savedEmail);
            Alert.alert('Signed in!', `Welcome ${savedEmail}`);
            await SecureStore.deleteItemAsync('emailForSignIn');
          } catch (error) {
            Alert.alert('Sign-in error', error.message);
          }
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    })();

    return () => subscription.remove();
  }, []);

  const sendLink = async () => {
    if (!email) return Alert.alert('Missing email', 'Please enter your email');
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      await SecureStore.setItemAsync('emailForSignIn', email);
      Alert.alert('Check your email', 'Sign-in link sent!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserEmail(null);
      Alert.alert('Signed out', 'You have been signed out.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (userEmail) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Signed in with Email</Text>

        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={userEmail}
          editable={false}
          selectTextOnFocus={false}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignOut}>
          <Text style={styles.primaryButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sign in with Email</Text>
      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={sendLink}>
        <Text style={styles.primaryButtonText}>Send Sign-In Link</Text>
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
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2b2e33',
    color: '#fff',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  disabledInput: {
    color: '#bbb',
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: '#ffd33d',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#1f2226',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
