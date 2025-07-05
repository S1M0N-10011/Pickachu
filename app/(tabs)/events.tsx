import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EventScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('https://op-core.pokemon.com/api/v2/event_locator/search?latitude=52.3676&longitude=4.9041&distance=10')
      .then((response) => response.json())
      .then((json) => {
        setEvents(json.activities || []);
      })
      .catch((err) => {
        setError('Failed to load events.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Filter events by search text
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const date = new Date(item.start_datetime).toLocaleDateString();
    return (
      <TouchableOpacity
        style={styles.eventContainer}
        onPress={() => {
          if (item.metadata?.event_website) {
            Linking.openURL(item.metadata.event_website);
          }
        }}
      >
        <Text style={styles.eventName}>{item.name}</Text>
        <Text style={styles.eventDate}>{date}</Text>
        <Text style={styles.eventAddress}>{item.address?.formatted_address}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search events..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.guid}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.noResults}>No events found.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2226',
    padding: 16,
    paddingBottom: 80,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  eventContainer: {
    backgroundColor: '#2a2e33',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  eventName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  eventDate: {
    color: '#ccc',
    marginTop: 4,
  },
  eventAddress: {
    color: '#aaa',
    marginTop: 2,
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
  noResults: {
    color: '#888',
    fontSize: 18,
    marginTop: 20,
    alignSelf: 'center',
  },
});
