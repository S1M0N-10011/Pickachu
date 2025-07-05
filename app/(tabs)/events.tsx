import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
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
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'distance'

  // Default to Netherlands coordinates as fallback
  const [latitude, setLatitude] = useState('52.1326');
  const [longitude, setLongitude] = useState('5.2913');
  const [distance, setDistance] = useState('50');

  const hasFetchedRef = useRef(false);
  const hasInitializedLocationRef = useRef(false);
  const prevParamsRef = useRef({ latitude: '', longitude: '', distance: '' });

  // Load cached location on component mount
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
        // No cached location, use default Netherlands coordinates
        console.log('No cached location, using default coordinates');
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
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
        
        // Cache the location when events are successfully fetched
        await cacheLocation(customLat, customLng, customDist);
        
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

  const filteredEvents = events
    .filter((event) =>
      event.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'distance':
          // Note: You'd need to calculate distance if the API provides coordinates
          // For now, just sort by name as fallback
          return a.name.localeCompare(b.name);
        case 'date':
        default:
          return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
      }
    });

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
            setSortModalVisible(true);
          }}
        >
          <Feather name="sliders" size={24} color="#ffd33d" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => {
            Keyboard.dismiss();
            router.push({
              pathname: '/map-picker',
              params: {
                initialLat: latitude,
                initialLng: longitude,
                initialRadius: distance,
              },
            });
          }}
        >
          <Feather name="map-pin" size={24} color="#ffd33d" />
        </TouchableOpacity>
      </View>

      {error && (
        <TouchableOpacity onPress={() => fetchEvents(false)}>
          <Text style={styles.errorText}>{error} Tap to retry.</Text>
        </TouchableOpacity>
      )}

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
                  const addressText = getAddress(item.address);
                  const date = item.start_datetime
                    ? new Date(item.start_datetime).toLocaleDateString()
                    : 'No date';

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

      {/* Sort Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Events</Text>
              <TouchableOpacity
                onPress={() => setSortModalVisible(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'date' && styles.sortOptionActive]}
              onPress={() => {
                setSortBy('date');
                setSortModalVisible(false);
              }}
            >
              <Feather name="calendar" size={20} color={sortBy === 'date' ? '#ffd33d' : '#fff'} />
              <Text style={[styles.sortOptionText, sortBy === 'date' && styles.sortOptionTextActive]}>
                Sort by Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
              onPress={() => {
                setSortBy('name');
                setSortModalVisible(false);
              }}
            >
              <Feather name="type" size={20} color={sortBy === 'name' ? '#ffd33d' : '#fff'} />
              <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextActive]}>
                Sort by Name
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'distance' && styles.sortOptionActive]}
              onPress={() => {
                setSortBy('distance');
                setSortModalVisible(false);
              }}
            >
              <Feather name="navigation" size={20} color={sortBy === 'distance' ? '#ffd33d' : '#fff'} />
              <Text style={[styles.sortOptionText, sortBy === 'distance' && styles.sortOptionTextActive]}>
                Sort by Distance
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2a2e33',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: '#1f2226',
  },
  sortOptionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  sortOptionTextActive: {
    color: '#ffd33d',
  },
});