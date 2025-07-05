import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

  const [radius, setRadius] = useState(initialRadiusMiles * 1609.34); // meters

  const onApply = () => {
    router.replace({
      pathname: '/(tabs)/events',
      params: {
        latitude: center.latitude.toFixed(6),
        longitude: center.longitude.toFixed(6),
        distance: (radius / 1609.34).toFixed(1),
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...center,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onPress={(e) => setCenter(e.nativeEvent.coordinate)}
      >
        <Circle
          center={center}
          radius={radius}
          fillColor="rgba(255,211,61,0.2)"
          strokeColor="#ffd33d"
        />
        <Marker coordinate={center} />
      </MapView>

      <View style={styles.bottomPanel}>
        <Text style={styles.label}>
          Radius: {(radius / 1609.34).toFixed(1)} miles
        </Text>
        <Slider
          style={{ width: '100%' }}
          minimumValue={1 * 1609.34}
          maximumValue={250 * 1609.34}
          step={1 * 1609.34}
          value={radius}
          onValueChange={setRadius}
          minimumTrackTintColor="#ffd33d"
        />
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
    paddingBottom: 120,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
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
