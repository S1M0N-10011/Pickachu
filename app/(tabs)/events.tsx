import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const LOCATION_CACHE_KEY = 'tcg_app_location_cache';

interface LocationCache {
  latitude: string;
  longitude: string;
  distance: string;
  timestamp: number;
}

export default function EventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [distance, setDistance] = useState('');

  const hasFetchedRef = useRef(false);
  const prevParamsRef = useRef({ latitude: '', longitude: '', distance: '' });

  useEffect(() => {
    loadCachedLocation();
  }, []);

  const loadCachedLocation = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedData) {
        const parsed: LocationCache = JSON.parse(cachedData);
        setLatitude(parsed.latitude);
        setLongitude(parsed.longitude);
        setDistance(parsed.distance);
        console.log('Loaded cached location:', parsed);
      } else {
        const defaultLat = '52.1326';
        const defaultLng = '5.2913';
        const defaultDist = '50';

        setLatitude(defaultLat);
        setLongitude(defaultLng);
        setDistance(defaultDist);

        await cacheLocation(defaultLat, defaultLng, defaultDist);
        console.log('No cached location, using and caching default coordinates');
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
      setLatitude('52.1326');
      setLongitude('5.2913');
      setDistance('50');
    }
  };

  const cacheLocation = async (lat: string, lng: string, dist: string) => {
    try {
      const cacheData: LocationCache = {
        latitude: lat,
        longitude: lng,
        distance: dist,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
      console.log('Cached location:', cacheData);
    } catch (error) {
      console.error('Error caching location:', error);
    }
  };

  const getCurrentCachedLocation = useCallback(async () => {
    try {
      const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedData) {
        const parsed: LocationCache = JSON.parse(cachedData);
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          distance: parsed.distance,
        };
      }
    } catch (error) {
      console.error('Error getting cached location:', error);
    }
    return { latitude, longitude, distance };
  }, [latitude, longitude, distance]);

  const fetchEvents = useCallback(
    async (
      isRefresh = false,
      customLat?: string,
      customLng?: string,
      customDist?: string
    ) => {
      let lat = customLat || latitude;
      let lng = customLng || longitude;
      let dist = customDist || distance;

      if (isRefresh && !customLat && !customLng && !customDist) {
        const cachedLocation = await getCurrentCachedLocation();
        lat = cachedLocation.latitude;
        lng = cachedLocation.longitude;
        dist = cachedLocation.distance;

        if (lat !== latitude || lng !== longitude || dist !== distance) {
          setLatitude(lat);
          setLongitude(lng);
          setDistance(dist);
        }
      }

      if (!lat || !lng || !dist) {
        return;
      }

      setError(null);
      if (!isRefresh) {
        setEvents([]);
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const distMiles = Math.round(parseFloat(dist) / 1.60934);
        const url = `https://op-core.pokemon.com/api/v2/event_locator/search?latitude=${lat}&longitude=${lng}&distance=${distMiles}`;
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

        await cacheLocation(lat, lng, dist);
      } catch (err) {
        setError('Failed to load events.');
        console.error('Event fetch error:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [latitude, longitude, distance, getCurrentCachedLocation]
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

      if (hasChanged && hasFetchedRef.current) {
        setSearch('');
      }

      fetchEvents(false, lat, lng, dist);

      prevParamsRef.current = { latitude: lat, longitude: lng, distance: dist };
      hasFetchedRef.current = true;
    }
  }, [params.latitude, params.longitude, params.distance, fetchEvents]);

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

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLocationButtonPress = async () => {
    Keyboard.dismiss();
    const currentLocation = await getCurrentCachedLocation();

    router.push({
      pathname: '/map-picker',
      params: {
        initialLat: currentLocation.latitude,
        initialLng: currentLocation.longitude,
        initialRadius: currentLocation.distance,
      },
    });
  };

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
        <TouchableOpacity style={styles.searchButton}>
          <Feather name="sliders" size={24} color="#ffd33d" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleLocationButtonPress}
        >
          <Feather name="map-pin" size={24} color="#ffd33d" />
        </TouchableOpacity>
      </View>

      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Finding events near you...</Text>
        </View>
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
                  router.push({
                    pathname: '/event-details',
                    params: {
                      name: item.name,
                      date,
                      address: addressText,
                      link: item.metadata?.event_website,
                      details: item.metadata?.details,
                      contact_email: item.metadata?.contact_email,
                      contact_phone: item.metadata?.contact_phone,
                      third_party_url: item.metadata?.third_party_url,
                    },
                  });
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
            <TouchableOpacity
              onPress={() => {
                if (error) {
                  fetchEvents(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.messageText}>
                {error ? `${error} Tap to retry.` : 'No events found.'}
              </Text>
            </TouchableOpacity>
          }
          refreshing={refreshing}
          onRefresh={() => fetchEvents(true)}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: filteredEvents.length === 0 ? 0 : 80,
          }}
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
  locationButton: {
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
  messageText: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
});
