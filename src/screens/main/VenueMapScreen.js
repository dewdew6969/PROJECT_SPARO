import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import useAppStore from '../../store/useAppStore';

const { width, height } = Dimensions.get('window');

export default function VenueMapScreen({ navigation, route }) {
  const { profile, t, language } = useAppStore();
  
  // Custom Map Style for Dark Theme
  const mapRef = useRef(null);
  const [homeLocation, setHomeLocation] = useState({ latitude: -6.214, longitude: 106.81 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const pinAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRegion, setCurrentRegion] = useState({
    latitude: -6.214,
    longitude: 106.81,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  // This simulates reverse geocoding
  const [selectedAddress, setSelectedAddress] = useState('Custom Location');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    const fetchHomeLocation = async () => {
      try {
        if (profile?.location) {
          const result = await Location.geocodeAsync(profile.location);
          if (result.length > 0) {
            const loc = { latitude: result[0].latitude, longitude: result[0].longitude };
            setHomeLocation(loc);
            
            const newRegion = { ...loc, latitudeDelta: 0.05, longitudeDelta: 0.05 };
            setCurrentRegion(newRegion);
            if (mapRef.current) {
              mapRef.current.animateToRegion(newRegion, 1000);
            }
          }
        }
      } catch (e) {
        console.log("Could not geocode user location", e);
      }
    };
    fetchHomeLocation();
  }, [profile?.location]);

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Izin lokasi ditolak. Peta akan tetap menggunakan lokasi profil Anda.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const liveLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      // Override homeLocation so future searches are bounded around their physical location
      setHomeLocation(liveLoc);
      
      const newRegion = { ...liveLoc, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setCurrentRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (e) {
      alert('Gagal mengambil lokasi GPS saat ini.');
    }
  };

  const onRegionChange = () => {
    if (!isDragging) {
      setIsDragging(true);
      Animated.spring(pinAnim, {
        toValue: -15,
        useNativeDriver: true,
      }).start();
    }
  };

  const onRegionChangeComplete = async (region) => {
    setIsDragging(false);
    setIsLoadingAddress(true);
    Animated.spring(pinAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    setCurrentRegion(region);
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude
      });
      if (result.length > 0) {
        const place = result[0];
        // Combine street, name, or city
        const namePart = place.name || place.street || '';
        const cityPart = place.city || place.subregion || '';
        let address = namePart;
        if (cityPart && cityPart !== namePart) {
          address += address ? `, ${cityPart}` : cityPart;
        }
        setSelectedAddress(address || `Lat: ${region.latitude.toFixed(4)}, Lng: ${region.longitude.toFixed(4)}`);
      } else {
        setSelectedAddress(`Lat: ${region.latitude.toFixed(4)}, Lng: ${region.longitude.toFixed(4)}`);
      }
    } catch (e) {
      setSelectedAddress(`Lat: ${region.latitude.toFixed(4)}, Lng: ${region.longitude.toFixed(4)}`);
    }
    setIsLoadingAddress(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // 1. Jika ada auto-complete suggestion yang tampil, langsung pilih yang pertama (paling relevan)
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }

    // 2. Jika tidak ada suggestion, cari secara manual dengan Photon API (tetap dilimit sesuai lokasi sekitar user)
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=${currentRegion.latitude}&lon=${currentRegion.longitude}&limit=1`, {
        headers: { 'User-Agent': 'SparoApp/1.0' }
      });
      const data = await res.json();
      
      if (data && data.features && data.features.length > 0) {
        const geom = data.features[0].geometry;
        const newRegion = {
          latitude: parseFloat(geom.coordinates[1]),
          longitude: parseFloat(geom.coordinates[0]),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        };
        setCurrentRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
        setIsFocused(false);
      } else {
        // Fallback terakhir ke sistem Apple/Google Maps bawaan OS
        const result = await Location.geocodeAsync(searchQuery);
        if (result.length > 0) {
          const loc = result[0];
          const newRegion = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          };
          setCurrentRegion(newRegion);
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
          setIsFocused(false);
        } else {
          alert('Lokasi tidak ditemukan di area sekitar.');
        }
      }
    } catch (e) {
      alert('Error mencari lokasi.');
    }
  };

  const handleSearchInput = (text) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (text.trim().length > 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          // Menggunakan Photon API tanpa bbox kaku agar hasil rekomendasi jauh lebih banyak
          // namun tetap diprioritaskan (di-sorting) berdasarkan jarak terdekat (lat/lon)
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lat=${currentRegion.latitude}&lon=${currentRegion.longitude}&limit=25`, {
            headers: { 'User-Agent': 'SparoApp/1.0' }
          });
          const data = await res.json();
          
          if (data && data.features) {
            const formatted = data.features.map(f => {
              const props = f.properties;
              const geom = f.geometry;
              
              const addressParts = [];
              if (props.street) addressParts.push(props.street);
              if (props.district) addressParts.push(props.district);
              if (props.city) addressParts.push(props.city);
              if (props.state) addressParts.push(props.state);
              
              const addressStr = addressParts.join(', ');
              
              return {
                name: props.name || props.street || 'Lokasi',
                display_name: props.name ? `${props.name}${addressStr ? ', ' + addressStr : ''}` : addressStr,
                lat: geom.coordinates[1],
                lon: geom.coordinates[0]
              };
            });
            
            // Hapus duplikat yang memiliki display_name sama persis
            const uniqueFormatted = formatted.filter((v,i,a)=>a.findIndex(t=>(t.display_name === v.display_name))===i);
            
            setSuggestions(uniqueFormatted);
          } else {
            setSuggestions([]);
          }
        } catch (e) {
          console.log(e);
        }
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item) => {
    const name = item.name || item.display_name.split(',')[0];
    setSearchQuery(name);
    setSuggestions([]);
    setIsFocused(false);
    
    const newRegion = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };
    setCurrentRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const confirmSelection = () => {
    const finalName = searchQuery.trim() !== '' ? searchQuery : 'Custom Location';
    const venue = {
      id: `custom_${Date.now()}`,
      name: finalName,
      distance: 'Custom distance',
      type: 'Outdoor/Indoor',
      status: 'AVAILABLE',
      latitude: currentRegion.latitude,
      longitude: currentRegion.longitude
    };
    const { setTempVenue } = useAppStore.getState();
    setTempVenue(venue);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('select_venue')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={currentRegion}
          onRegionChange={onRegionChange}
          onRegionChangeComplete={onRegionChangeComplete}
          userInterfaceStyle="dark"
          showsUserLocation={true}
          showsMyLocationButton={false}
        />
        
        {/* Fixed Center Pin */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <Animated.View style={{ transform: [{ translateY: pinAnim }] }}>
            <MaterialIcons name="location-on" size={48} color="#D4FF00" style={styles.pinIcon} />
          </Animated.View>
          <Animated.View style={[
            styles.pinShadow, 
            { 
              transform: [
                { scaleX: pinAnim.interpolate({ inputRange: [-15, 0], outputRange: [0.5, 2] }) },
                { scaleY: pinAnim.interpolate({ inputRange: [-15, 0], outputRange: [0.5, 1] }) }
              ],
              opacity: pinAnim.interpolate({ inputRange: [-15, 0], outputRange: [0.3, 0.6] })
            }
          ]} />
        </View>

        {/* Search Bar Float */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#8A95A5" />
            <TextInput 
              style={styles.searchInput}
              placeholder={t('search_placeholder') === 'search_placeholder' ? 'Cari nama lokasi...' : t('search_placeholder')}
              placeholderTextColor="#8A95A5"
              value={searchQuery}
              onChangeText={handleSearchInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }}>
                <Feather name="x" size={20} color="#8A95A5" />
              </TouchableOpacity>
            )}
          </View>

          {isFocused && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Feather name="map-pin" size={16} color="#8A95A5" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionText} numberOfLines={1}>{item.name || item.display_name.split(',')[0]}</Text>
                      <Text style={styles.suggestionSubText} numberOfLines={1}>{item.display_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Locate Me GPS Button */}
        <TouchableOpacity style={styles.locateMeBtn} onPress={handleLocateMe}>
          <MaterialIcons name="my-location" size={24} color="#0F1522" />
        </TouchableOpacity>
      </View>

      {/* Selected Venue Info */}
      <View style={styles.bottomCard}>
        <View style={styles.venueInfo}>
          {isDragging ? (
            <>
              <Text style={styles.venueName}>Mencari lokasi...</Text>
              <Text style={styles.venueDesc}>Geser peta untuk menentukan titik</Text>
            </>
          ) : isLoadingAddress ? (
            <>
              <Text style={styles.venueName}>Memuat alamat...</Text>
              <Text style={styles.venueDesc}>Mohon tunggu sebentar</Text>
            </>
          ) : (
            <>
              <Text style={styles.venueName} numberOfLines={1}>{searchQuery || 'Titik Lokasi Pilihan'}</Text>
              <Text style={styles.venueDesc} numberOfLines={2}>{selectedAddress}</Text>
            </>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.confirmBtn, (isDragging || isLoadingAddress) && { backgroundColor: '#2D3748' }]} 
          onPress={confirmSelection}
          disabled={isDragging || isLoadingAddress}
        >
          <Text style={[styles.confirmBtnText, (isDragging || isLoadingAddress) && { color: '#8A95A5' }]}>PILIH LOKASI</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#0F1522',
    borderBottomWidth: 1,
    borderBottomColor: '#1C2433'
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  searchWrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchContainer: {
    backgroundColor: '#1C2433',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#2D3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  suggestionsContainer: {
    backgroundColor: '#1C2433',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2D3748',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  suggestionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  suggestionSubText: {
    color: '#8A95A5',
    fontSize: 11,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24, // half of icon size (48/2)
    marginTop: -48, // offset icon size so the point is at the center
    alignItems: 'center',
  },
  pinIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pinShadow: {
    width: 12,
    height: 6,
    backgroundColor: '#000',
    borderRadius: 6,
    marginTop: -2,
  },
  locateMeBtn: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    backgroundColor: '#D4FF00',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueInfo: { flex: 1, marginRight: 15 },
  venueName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  venueDesc: { fontSize: 12, color: '#8A95A5' },
  confirmBtn: {
    backgroundColor: '#D4FF00',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnText: {
    color: '#0F1522',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
