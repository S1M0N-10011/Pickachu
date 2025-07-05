import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EventScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [latitude, setLatitude] = useState('52.1326');
  const [longitude, setLongitude] = useState('5.2913');
  const [distance, setDistance] = useState('100');

  const [modalVisible, setModalVisible] = useState(false);

  const fetchEvents = useCallback(
    async (isRefresh = false) => {
      setError(null);
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const url = `https://op-core.pokemon.com/api/v2/event_locator/search?latitude=${latitude}&longitude=${longitude}&distance=${distance}`;
        const response = await fetch(url);
        const json = await response.json();
        setEvents(json.activities || []);
      } catch (err) {
        setError('Failed to load events.');
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [latitude, longitude, distance]
  );

  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

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

  const isValidNumber = (value) => !isNaN(parseFloat(value)) && isFinite(value);

  const applyParams = () => {
    if (
      !isValidNumber(latitude) ||
      !isValidNumber(longitude) ||
      !isValidNumber(distance)
    ) {
      alert('Please enter valid numeric values.');
      return;
    }
    setModalVisible(false);
    fetchEvents(false);
    Keyboard.dismiss();
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
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            Keyboard.dismiss();
            setModalVisible(true);
          }}
        >
          <Feather name="sliders" size={24} color="#ffd33d" />
        </TouchableOpacity>
      </View>

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

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Search Parameters</Text>

            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
              placeholder="Latitude"
              placeholderTextColor="#888"
            />

            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
              placeholder="Longitude"
              placeholderTextColor="#888"
            />

            <Text style={styles.label}>Distance (mi)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={distance}
              onChangeText={setDistance}
              placeholder="Distance"
              placeholderTextColor="#888"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonApply]}
                onPress={applyParams}
              >
                <Text style={styles.modalButtonApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#2a2e33',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 16,
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
    fontSize: 18,
  },
  noResults: {
    color: '#888',
    fontSize: 18,
    marginTop: 20,
    alignSelf: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#2a2e33',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    color: '#ccc',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1f2226',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    height: 40,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButtonApply: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ffd33d',
  },
  modalButtonApplyText: {
    color: '#25292e',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalButtonCancel: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#555',
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
