import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Linking,
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
      Linking.openURL(url);
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
              <Text style={styles.text}>{date}</Text>
            </View>
          )}

          {address && (
            <View style={styles.section}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.text}>{address}</Text>
            </View>
          )}

          {(contact_email || contact_phone) && (
            <View style={styles.section}>
              <Text style={styles.label}>Contact</Text>
              {contact_email && (
                <Text style={styles.text}>Email: {contact_email}</Text>
              )}
              {contact_phone && (
                <Text style={styles.text}>Phone: {contact_phone}</Text>
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
    textDecorationLine: 'underline',
  },
});
