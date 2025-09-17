import Constants from 'expo-constants';
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

export type AddressDetails = {
  address: string;
  latitude: number;
  longitude: number;
  postalCode: string;
  countryCode: string;
  country: string;
  stateCode: string;
  state: string;
  city: string;
};

type Props = {
  value: string;
  onChangeText: (val: string) => void;
  onPlaceSelect: (details: AddressDetails) => void;
  onValidAddressSelected?: (isValid: boolean) => void;
};

type AutocompletePrediction = {
  description: string;
  place_id: string;
};

const isWeb = Platform.OS === 'web';
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const AddressAutocompleteInput: React.FC<Props> = ({
  value,
  onChangeText,
  onPlaceSelect,
  onValidAddressSelected,
}) => {
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [inputTouched, setInputTouched] = useState(false);

  // Use a different state for the API key to handle the potential undefined value.
  // Although we are now using the backend, it's good practice to keep this for
  // potential future use or to signal a configuration issue.
  const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey;

  // Updated fetchSuggestions function to call the backend proxy
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        if (isWeb) {
          const res = await fetch(`${BACKEND_URL}/api/autocomplete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: value }),
          });
          const json = await res.json();
          const mapped = Array.isArray(json.suggestions)
            ? json.suggestions
                .map((s: any) => ({
                  description: s.placePrediction?.text?.text ?? '',
                  place_id: s.placePrediction?.placeId ?? '',
                }))
                .filter((s: AutocompletePrediction) => s.description && s.place_id)
            : [];
          setSuggestions(mapped);
        } else {
          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            value,
          )}&key=${apiKey}&language=en`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === 'OK') {
            setSuggestions(json.predictions);
          } else {
            setSuggestions([]);
          }
        }
      } catch (error) {
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [value]);

  // Updated fetchPlaceDetails function to call the backend proxy
  const fetchPlaceDetails = async (placeId: string) => {
    try {
      if (isWeb) {
        const res = await fetch(`${BACKEND_URL}/api/place-details?place_id=${placeId}`);
        const json = await res.json();

        const lat = json.location?.latitude;
        const lng = json.location?.longitude;
        const address = json.formattedAddress;

        const getComp = (type: string, field: 'shortText' | 'longText' = 'shortText') =>
          json.addressComponents?.find((c: any) => c.types?.includes(type))?.[field] || '';

        if (lat !== undefined && lng !== undefined && address) {
          onPlaceSelect({
            address,
            latitude: lat,
            longitude: lng,
            postalCode: getComp('postal_code'),
            countryCode: getComp('country'),
            country: getComp('country', 'longText'),
            stateCode: getComp('administrative_area_level_1'),
            state: getComp('administrative_area_level_1', 'longText'),
            city:
              getComp('locality', 'longText') || getComp('administrative_area_level_2', 'longText'),
          });

          setSuggestions([]);
          onValidAddressSelected?.(true);
        } else {
          console.warn('Place details fetch failed');
          onValidAddressSelected?.(false);
        }
      } else {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.status === 'OK') {
          const result = json.result;
          const lat = result.geometry.location.lat;
          const lng = result.geometry.location.lng;
          const address = result.formatted_address;

          const getComp = (type: string) =>
            result.address_components.find((c: any) => c.types.includes(type))?.short_name || '';

          onPlaceSelect({
            address,
            latitude: lat,
            longitude: lng,
            postalCode: getComp('postal_code'),
            countryCode: getComp('country'),
            country: getComp('country'),
            stateCode: getComp('administrative_area_level_1'),
            state: getComp('administrative_area_level_1'),
            city: getComp('locality') || getComp('administrative_area_level_2'),
          });

          setSuggestions([]);
          onValidAddressSelected?.(true);
        } else {
          console.warn('Place details fetch failed:', json.status);
          onValidAddressSelected?.(false);
        }
      }
    } catch (err) {
      console.error('Place details error:', err);
      onValidAddressSelected?.(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setInputTouched(true);
          onValidAddressSelected?.(false);
        }}
        placeholder="Search address"
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      {suggestions.length > 0 && inputTouched && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            style={styles.flatList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  onChangeText(item.description);
                  fetchPlaceDetails(item.place_id);
                  setInputTouched(false);
                }}
                style={[
                  styles.suggestion,
                  index === suggestions.length - 1 && styles.lastSuggestion,
                ]}
              >
                <Text style={{ color: '#fff' }}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default AddressAutocompleteInput;

const shadowStyle = Platform.select({
  web: {
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
  },
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  android: {
    elevation: 8,
  },
});

const styles = StyleSheet.create({
  dropdownContainer: {
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    maxHeight: 240,
    overflow: 'hidden',
    ...shadowStyle,
  },
  flatList: {
    maxHeight: 240,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#f9fafb',
    padding: 14,
  },
  lastSuggestion: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  suggestion: {
    borderBottomColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
});
