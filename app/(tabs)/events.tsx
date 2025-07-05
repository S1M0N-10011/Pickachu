import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const router = useRouter();
  const params = useLocalSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [latitude, setLatitude] = useState('52.1326');
  const [longitude, setLongitude] = useState('5.2913');
  const [distance, setDistance] = useState('100');

  const hasFetchedRef = useRef(false);
  const prevParamsRef = useRef({ latitude: '', longitude: '', distance: '' });

  const fetchEvents = useCallback(
    async (
      isRefresh = false,
      customLat = latitude,
      customLng = longitude,
      customDist = distance
    ) => {
      setError(null);
      if (!isRefresh) {
        setEvents([]);
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const url = `https://op-core.pokemon.com/api/v2/event_locator/search?latitude=${customLat}&longitude=${customLng}&distance=${customDist}`;
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType}`);
        }

        const json = await response.json();
        setEvents(json.activities || []);
      } catch (err) {
        setError('Failed to load events.');
        console.error('Event fetch error:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [latitude, longitude, distance]
  );

  useEffect(() => {
    const lat = (params.latitude as string) ?? latitude;
    const lng = (params.longitude as string) ?? longitude;
    const dist = (params.distance as string) ?? distance;

    const prev = prevParamsRef.current;
    const hasChanged =
      lat !== prev.latitude || lng !== prev.longitude || dist !== prev.distance;

    if (hasChanged || !hasFetchedRef.current) {
      setLatitude(lat);
      setLongitude(lng);
      setDistance(dist);
      fetchEvents(false, lat, lng, dist);

      prevParamsRef.current = { latitude: lat, longitude: lng, distance: dist };
      hasFetchedRef.current = true;
    }
  }, [params.latitude, params.longitude, params.distance]);

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
    .filter((event) =>
      event.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime()
    );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search events..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            Keyboard.dismiss();
            router.push({
              pathname: '/(tabs)/map-picker',
              params: {
                initialLat: latitude,
                initialLng: longitude,
                initialRadius: distance,
              },
            });
          }}
        >
          <Feather name="sliders" size={24} color="#ffd33d" />
        </TouchableOpacity>
      </View>

      {error && (
        <TouchableOpacity onPress={() => fetchEvents(false)}>
          <Text style={styles.errorText}>{error} Tap to retry.</Text>
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
                {addressText && (
                  <Text style={styles.eventAddress}>{addressText}</Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.noResults}>No events found.</Text>
          }
          refreshing={refreshing}
          onRefresh={() =>
            fetchEvents(true, latitude, longitude, distance)
          }
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
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
  },
  searchButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  noResults: {
    color: '#888',
    fontSize: 18,
    marginTop: 20,
    alignSelf: 'center',
  },
});
