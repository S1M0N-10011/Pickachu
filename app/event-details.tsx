import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EventDetailsScreen() {
  const {
    name,
    date,
    address,
    link,
    details,
    contact_email,
    contact_phone,
  } = useLocalSearchParams();

  const openLink = async (url: string) => {
    if (await Linking.canOpenURL(url)) {
      WebBrowser.openBrowserAsync(url);
    }
  };

  const openCalendar = async () => {
    const url = Platform.OS === 'ios'
      ? 'calshow://'
      : 'content://com.android.calendar/time/';
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    }
  };

  const openEmail = async (email: string) => {
    const url = `mailto:${email}`;
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    }
  };

  const openPhone = async (phone: string) => {
    const url = `tel:${phone}`;
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    }
  };

  const openAddress = async (addr: string) => {
    const encodedAddress = encodeURIComponent(addr);
    const url = `https://maps.google.com/?q=${encodedAddress}`;
    if (await Linking.canOpenURL(url)) {
      WebBrowser.openBrowserAsync(url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{name}</Text>

          {details && (
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.text}>{details}</Text>
            </View>
          )}

          {date && (
            <View style={styles.section}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity onPress={openCalendar}>
                <Text style={styles.link}>{date}</Text>
              </TouchableOpacity>
            </View>
          )}

          {address && (
            <View style={styles.section}>
              <Text style={styles.label}>Address</Text>
              <TouchableOpacity onPress={() => openAddress(address as string)}>
                <Text style={styles.link}>{address}</Text>
              </TouchableOpacity>
            </View>
          )}

          {(contact_email || contact_phone) && (
            <View style={styles.section}>
              <Text style={styles.label}>Contact</Text>
              {contact_email && (
                <TouchableOpacity onPress={() => openEmail(contact_email as string)}>
                  <Text style={styles.link}>Email: {contact_email}</Text>
                </TouchableOpacity>
              )}
              {contact_phone && (
                <TouchableOpacity onPress={() => openPhone(contact_phone as string)}>
                  <Text style={styles.link}>Phone: {contact_phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {link && (
            <View style={styles.section}>
              <Text style={styles.label}>Website</Text>
              <TouchableOpacity onPress={() => openLink(link as string)}>
                <Text style={styles.link}>{link}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1f2226',
  },
  container: {
    flex: 1,
    backgroundColor: '#1f2226',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd33d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  link: {
    fontSize: 16,
    color: '#ccc',
  },
});
