import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Linking,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EventScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false); // unified loading state for initial load
  const [refreshing, setRefreshing] = useState(false); // for pull-to-refresh only
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchEvents = useCallback(async (isRefresh = false) => {
    setError(null);
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch(
        'https://op-core.pokemon.com/api/v2/event_locator/search?latitude=52.132633&longitude=5.291265999999999&distance=100'
      );
      const json = await response.json();
      setEvents(json.activities || []);
    } catch (err) {
      setError('Failed to load events.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  // Helper to build a fallback address if formatted_address is missing
  const getAddress = (address) => {
    if (!address) return null;

    if (address.formatted_address) return address.formatted_address;

    const parts = [
      address.name,
      address.street_address,
      address.city,
      address.state,
      address.postal_code,
      address.country_code,
    ].filter(Boolean);

    return parts.length ? parts.join(', ') : null;
  };

  const filteredEvents = events
    .filter((event) => event.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search events..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      {error && (
        <TouchableOpacity
          style={{ marginBottom: 16 }}
          onPress={() => fetchEvents(false)}
          activeOpacity={0.7}
        >
          <Text style={[styles.errorText, { textAlign: 'center' }]}>
            {error} Tap to retry.
          </Text>
        </TouchableOpacity>
      )}

      {loading && events.length === 0 ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.guid}
          renderItem={({ item }) => {
            const date = item.start_datetime
              ? new Date(item.start_datetime).toLocaleDateString()
              : 'No date';

            const addressText = getAddress(item.address);

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
                {addressText ? (
                  <Text style={styles.eventAddress}>{addressText}</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.noResults}>No events found.</Text>
          }
          refreshing={refreshing}
          onRefresh={() => fetchEvents(true)}
          contentContainerStyle={{ paddingBottom: 80 }}
          onScrollBeginDrag={() => Keyboard.dismiss()}
        />
      )}
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
