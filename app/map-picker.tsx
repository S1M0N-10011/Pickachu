import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

export default function MapPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialLat = parseFloat(params.initialLat as string) || 52.1326;
  const initialLng = parseFloat(params.initialLng as string) || 5.2913;
  const initialRadiusMiles = parseFloat(params.initialRadius as string) || 100;

  const [center, setCenter] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [region, setRegion] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  // Store radius in kilometers for UI, convert to meters for map circle
  const [radiusKm, setRadiusKm] = useState(initialRadiusMiles * 1.60934);
  const [locationLoading, setLocationLoading] = useState(false);

  // Helper functions for conversions
  const kmToMiles = (km: number) => km / 1.60934;
  const kmToMeters = (km: number) => km * 1000;
  const milesToKm = (miles: number) => miles * 1.60934;

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to find events near you.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to find Pokemon TCG events near you. You can still use the app by manually selecting a location.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLat = location.coords.latitude;
      const newLng = location.coords.longitude;

      const newCenter = {
        latitude: newLat,
        longitude: newLng,
      };

      const newRegion = {
        latitude: newLat,
        longitude: newLng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };

      setCenter(newCenter);
      setRegion(newRegion);
      
      setRadiusKm(20);

      console.log('Got user location:', { lat: newLat, lng: newLng });
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const onApply = () => {
    const radiusInMiles = Math.round(kmToMiles(radiusKm));
    
    router.replace({
      pathname: '/(tabs)/events',
      params: {
        latitude: center.latitude.toFixed(6),
        longitude: center.longitude.toFixed(6),
        distance: radiusInMiles.toString(),
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        region={region}
        onPress={(e) => {
          const newCoordinate = e.nativeEvent.coordinate;
          setCenter(newCoordinate);
        }}
        onRegionChangeComplete={setRegion}
      >
        <Circle
          center={center}
          radius={kmToMeters(radiusKm)}
          fillColor="rgba(255,211,61,0.2)"
          strokeColor="#ffd33d"
        />
        <Marker coordinate={center} />
      </MapView>

      <View style={styles.bottomPanel}>
        <Text style={styles.label}>
          Radius: {radiusKm.toFixed(1)} km
        </Text>
        <Slider
          style={{ width: '100%' }}
          minimumValue={1}
          maximumValue={400}
          step={1}
          value={radiusKm}
          onValueChange={setRadiusKm}
          minimumTrackTintColor="#ffd33d"
        />
        
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={requestLocationPermission}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color="#25292e" />
          ) : (
            <Text style={styles.locationButtonText}>Reset to Your Location</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onApply}>
          <Text style={styles.buttonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#1f2226',
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  locationButton: {
    backgroundColor: '#2a2e33',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#ffd33d',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#ffd33d',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#25292e',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});