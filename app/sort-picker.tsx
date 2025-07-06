import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export type SortOption = 'date' | 'distance' | 'name';
export type SortOrder = 'asc' | 'desc';

interface SortConfig {
  option: SortOption;
  order: SortOrder;
}

export default function SortPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialOption = (params.currentOption as SortOption) || 'date';
  const initialOrder = (params.currentOrder as SortOrder) || 'asc';

  const [selectedOption, setSelectedOption] = useState<SortOption>(initialOption);
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>(initialOrder);

  const sortOptions: { key: SortOption; label: string; icon: string }[] = [
    { key: 'date', label: 'Date', icon: 'calendar' },
    { key: 'distance', label: 'Distance', icon: 'map-pin' },
    { key: 'name', label: 'Name', icon: 'type' },
  ];

  const onApply = () => {
    router.replace({
      pathname: '/(tabs)/events',
      params: {
        sortOption: selectedOption,
        sortOrder: selectedOrder,
        latitude: params.latitude,
        longitude: params.longitude,
        distance: params.distance,
      },
    });
  };

  const onCancel = () => {
    router.back();
  };

  const getSortOrderIcon = (order: SortOrder) => {
    return order === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  const getSortOrderLabel = (option: SortOption, order: SortOrder) => {
    switch (option) {
      case 'date':
        return order === 'asc' ? 'Earliest First' : 'Latest First';
      case 'distance':
        return order === 'asc' ? 'Closest First' : 'Farthest First';
      case 'name':
        return order === 'asc' ? 'A to Z' : 'Z to A';
      default:
        return order === 'asc' ? 'Ascending' : 'Descending';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Sort by</Text>
        
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              selectedOption === option.key && styles.selectedOption
            ]}
            onPress={() => setSelectedOption(option.key)}
          >
            <View style={styles.optionContent}>
              <Feather 
                name={option.icon as any} 
                size={20} 
                color={selectedOption === option.key ? '#ffd33d' : '#ccc'} 
              />
              <Text style={[
                styles.optionText,
                selectedOption === option.key && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </View>
            {selectedOption === option.key && (
              <Feather name="check" size={20} color="#ffd33d" />
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Order</Text>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOrder === 'asc' && styles.selectedOption
          ]}
          onPress={() => setSelectedOrder('asc')}
        >
          <View style={styles.optionContent}>
            <Feather 
              name="arrow-up" 
              size={20} 
              color={selectedOrder === 'asc' ? '#ffd33d' : '#ccc'} 
            />
            <Text style={[
              styles.optionText,
              selectedOrder === 'asc' && styles.selectedOptionText
            ]}>
              {getSortOrderLabel(selectedOption, 'asc')}
            </Text>
          </View>
          {selectedOrder === 'asc' && (
            <Feather name="check" size={20} color="#ffd33d" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOrder === 'desc' && styles.selectedOption
          ]}
          onPress={() => setSelectedOrder('desc')}
        >
          <View style={styles.optionContent}>
            <Feather 
              name="arrow-down" 
              size={20} 
              color={selectedOrder === 'desc' ? '#ffd33d' : '#ccc'} 
            />
            <Text style={[
              styles.optionText,
              selectedOrder === 'desc' && styles.selectedOptionText
            ]}>
              {getSortOrderLabel(selectedOption, 'desc')}
            </Text>
          </View>
          {selectedOrder === 'desc' && (
            <Feather name="check" size={20} color="#ffd33d" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPanel}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2226',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e33',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 0,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2e33',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#3a3e43',
    borderWidth: 1,
    borderColor: '#ffd33d',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    color: '#ccc',
    fontSize: 16,
    marginLeft: 12,
  },
  selectedOptionText: {
    color: '#ffd33d',
    fontWeight: '600',
  },
  bottomPanel: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2e33',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#ffd33d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#25292e',
    fontSize: 16,
    fontWeight: '700',
  },
});
