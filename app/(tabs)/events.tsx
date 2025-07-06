import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const LOCATION_CACHE_KEY = 'tcg_app_location_cache';
const SORT_CACHE_KEY = 'tcg_app_sort_cache';
const EVENTS_CACHE_KEY = 'tcg_app_events_cache';

interface LocationCache {
  latitude: string;
  longitude: string;
  distance: string;
  timestamp: number;
}

interface SortCache {
  option: 'date' | 'distance' | 'name';
  order: 'asc' | 'desc';
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

  const [sortOption, setSortOption] = useState<'date' | 'distance' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const hasFetchedRef = useRef(false);
  const prevParamsRef = useRef({ latitude: '', longitude: '', distance: '' });
  const navigationInProgressRef = useRef(false);

  const cacheEvents = async (eventsToCache: any[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(eventsToCache));
      console.log('Cached events successfully');
    } catch (error) {
      console.error('Error caching events:', error);
    }
  };

  const loadCachedEvents = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cachedData) {
        const parsedEvents = JSON.parse(cachedData);
        setEvents(parsedEvents);
        console.log('Loaded cached events');
      }
    } catch (error) {
      console.error('Error loading cached events:', error);
    }
  };

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

  const loadCachedSort = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(SORT_CACHE_KEY);
      if (cachedData) {
        const parsed: SortCache = JSON.parse(cachedData);
        setSortOption(parsed.option);
        setSortOrder(parsed.order);
        console.log('Loaded cached sort:', parsed);
      }
    } catch (error) {
      console.error('Error loading cached sort:', error);
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

  const cacheSort = async (option: 'date' | 'distance' | 'name', order: 'asc' | 'desc') => {
    try {
      const cacheData: SortCache = { option, order };
      await AsyncStorage.setItem(SORT_CACHE_KEY, JSON.stringify(cacheData));
      console.log('Cached sort:', cacheData);
    } catch (error) {
      console.error('Error caching sort:', error);
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const sortEvents = useCallback((eventList: any[], currentLat: string, currentLng: string, currentSortOption = sortOption, currentSortOrder = sortOrder) => {
    const lat = parseFloat(currentLat);
    const lng = parseFloat(currentLng);

    return [...eventList].sort((a, b) => {
      let primaryComparison = 0;

      switch (currentSortOption) {
        case 'date':
          const dateA = a.start_datetime ? new Date(a.start_datetime) : new Date(0);
          const dateB = b.start_datetime ? new Date(b.start_datetime) : new Date(0);
          primaryComparison = dateA.getTime() - dateB.getTime();
          break;
        case 'distance':
          if (a.address?.latitude && a.address?.longitude && b.address?.latitude && b.address?.longitude) {
            const distA = calculateDistance(lat, lng, parseFloat(a.address.latitude), parseFloat(a.address.longitude));
            const distB = calculateDistance(lat, lng, parseFloat(b.address.latitude), parseFloat(b.address.longitude));
            primaryComparison = distA - distB;
          }
          break;
        case 'name':
          primaryComparison = a.name.localeCompare(b.name);
          break;
      }

      const orderedPrimaryComparison = currentSortOrder === 'asc' ? primaryComparison : -primaryComparison;

      if (orderedPrimaryComparison === 0 || currentSortOption !== 'name') {
        const secondaryComparison = a.name.localeCompare(b.name);
        return orderedPrimaryComparison === 0 ? secondaryComparison : orderedPrimaryComparison;
      }

      return orderedPrimaryComparison;
    });
  }, [sortOption, sortOrder]);

  const fetchEvents = useCallback(async (isRefresh = false, customLat?: string, customLng?: string, customDist?: string, customSortOption?: 'date' | 'distance' | 'name', customSortOrder?: 'asc' | 'desc') => {
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

    if (!lat || !lng || !dist) return;

    setError(null);
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const distMiles = Math.round(parseFloat(dist) / 1.60934);
      const url = `https://op-core.pokemon.com/api/v2/event_locator/search?latitude=${lat}&longitude=${lng}&distance=${distMiles}`;
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error(`Failed to fetch or invalid content type`);
      }

      const json = await response.json();
      const sortedEvents = sortEvents(json.activities || [], lat, lng, customSortOption, customSortOrder);
      setEvents(sortedEvents);

      await cacheLocation(lat, lng, dist);
      await cacheEvents(sortedEvents);

    } catch (err) {
      setError('Failed to load events.');
      console.error('Event fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [latitude, longitude, distance, getCurrentCachedLocation, sortEvents]);

  useEffect(() => {
    loadCachedLocation();
    loadCachedSort();
    loadCachedEvents();
  }, []);

  useEffect(() => {
    const newSortOption = (params.sortOption as 'date' | 'distance' | 'name') || sortOption;
    const newSortOrder = (params.sortOrder as 'asc' | 'desc') || sortOrder;

    if (newSortOption !== sortOption || newSortOrder !== sortOrder) {
      setSortOption(newSortOption);
      setSortOrder(newSortOrder);
      cacheSort(newSortOption, newSortOrder);
      if (events.length > 0) {
        const sortedEvents = sortEvents(events, latitude, longitude, newSortOption, newSortOrder);
        setEvents(sortedEvents);
      }
    }
  }, [params.sortOption, params.sortOrder, sortOption, sortOrder, events, latitude, longitude, sortEvents]);

  useEffect(() => {
    const lat = (params.latitude as string) ?? latitude;
    const lng = (params.longitude as string) ?? longitude;
    const dist = (params.distance as string) ?? distance;

    const prev = prevParamsRef.current;
    const hasChanged = lat !== prev.latitude || lng !== prev.longitude || dist !== prev.distance;

    if (hasChanged || !hasFetchedRef.current) {
      setLatitude(lat);
      setLongitude(lng);
      setDistance(dist);
      if (hasChanged && hasFetchedRef.current) setSearch('');
      const newSortOption = (params.sortOption as 'date' | 'distance' | 'name') || sortOption;
      const newSortOrder = (params.sortOrder as 'asc' | 'desc') || sortOrder;
      fetchEvents(false, lat, lng, dist, newSortOption, newSortOrder);
      prevParamsRef.current = { latitude: lat, longitude: lng, distance: dist };
      hasFetchedRef.current = true;
    }
  }, [params.latitude, params.longitude, params.distance, params.sortOption, params.sortOrder, fetchEvents, sortOption, sortOrder]);

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
    if (navigationInProgressRef.current) return;
    navigationInProgressRef.current = true;
    try {
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
    } finally {
      setTimeout(() => {
        navigationInProgressRef.current = false;
      }, 500);
    }
  };

  const handleSortButtonPress = async () => {
    if (navigationInProgressRef.current) return;
    navigationInProgressRef.current = true;
    try {
      Keyboard.dismiss();
      const currentLocation = await getCurrentCachedLocation();
      router.push({
        pathname: '/sort-picker',
        params: {
          currentOption: sortOption,
          currentOrder: sortOrder,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          distance: currentLocation.distance,
        },
      });
    } finally {
      setTimeout(() => {
        navigationInProgressRef.current = false;
      }, 500);
    }
  };

  const getSortButtonIcon = () => 'sliders';

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
        <TouchableOpacity style={styles.searchButton} onPress={handleSortButtonPress}>
          <Feather name={getSortButtonIcon()} size={24} color="#ffd33d" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationButton} onPress={handleLocationButtonPress}>
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
                {addressText && <Text style={styles.eventAddress}>{addressText}</Text>}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <TouchableOpacity onPress={() => error && fetchEvents(false)} activeOpacity={0.7}>
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

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768 || height >= 1024;

const getBottomPadding = () => {
  if (Platform.OS === 'ios') return isTablet ? 65 : 90;
  return isTablet ? 55 : 70;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2226',
    padding: isTablet ? 24 : 16,
    paddingBottom: getBottomPadding(),
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: isTablet ? 20 : 16,
  },
  searchInput: {
    height: isTablet ? 48 : 40,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    paddingHorizontal: isTablet ? 16 : 12,
    color: '#fff',
    fontSize: isTablet ? 16 : 14,
  },
  searchButton: {
    marginLeft: 12,
    padding: isTablet ? 12 : 8,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    marginLeft: 12,
    padding: isTablet ? 12 : 8,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContainer: {
    backgroundColor: '#2a2e33',
    padding: isTablet ? 16 : 12,
    marginBottom: isTablet ? 16 : 12,
    borderRadius: 8,
  },
  eventName: {
    color: '#fff',
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
  },
  eventDate: {
    color: '#ccc',
    marginTop: 4,
    fontSize: isTablet ? 16 : 14,
  },
  eventAddress: {
    color: '#aaa',
    marginTop: 2,
    fontSize: isTablet ? 14 : 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
    loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
    messageText: {
    marginTop: 16,
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
