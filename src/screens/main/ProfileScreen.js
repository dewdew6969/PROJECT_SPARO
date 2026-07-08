import React, { useContext, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  StatusBar, 
  Modal, 
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ScreenCapture from 'expo-screen-capture';
import * as Location from 'expo-location';
import useAppStore from '../../store/useAppStore';
import CustomAlert from '../../components/CustomAlert';
import CustomConfirmAlert from '../../components/CustomConfirmAlert';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import ZoomableImage from '../../components/profile/ZoomableImage';
import AvatarBottomSheet from '../../components/profile/AvatarBottomSheet';

const allSports = [
  { id: '1', name: 'Badminton', icon: 'badminton' },
  { id: '2', name: 'Futsal', icon: 'soccer' },
  { id: '3', name: 'Basketball', icon: 'basketball' },
  { id: '4', name: 'Volleyball', icon: 'volleyball' },
  { id: '5', name: 'Tennis', icon: 'tennis' },
  { id: '6', name: 'Billiards', icon: 'billiards' },
  { id: '7', name: 'Ping Pong', icon: 'table-tennis' },
  { id: '8', name: 'Mini Soccer', icon: 'soccer-field' },
  { id: '9', name: 'E-Sports', icon: 'gamepad-variant' },
  { id: '10', name: 'Chess', icon: 'chess-knight' },
  { id: '11', name: 'Golf', icon: 'golf' },
  { id: '12', name: 'Running', icon: 'run' },
  { id: '13', name: 'Cycling', icon: 'bike' },
  { id: '14', name: 'Swimming', icon: 'swim' },
  { id: '15', name: 'Gym', icon: 'dumbbell' },
];

const levelOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeOptions = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function ProfileScreen({ navigation }) {
  const { profile, updateProfile, language, setLanguage, t, logout } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  // Edit Form State
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [latitude, setLatitude] = useState(profile?.latitude || null);
  const [longitude, setLongitude] = useState(profile?.longitude || null);
  const [primarySport, setPrimarySport] = useState(profile?.primarySport || '');
  const [primaryLevel, setPrimaryLevel] = useState(profile?.primaryLevel || '');
  const [secondarySport, setSecondarySport] = useState(profile?.secondarySport || '');
  const [secondaryLevel, setSecondaryLevel] = useState(profile?.secondaryLevel || '');
  const [availableDays, setAvailableDays] = useState(profile?.availableDays || '');
  const [availableTime, setAvailableTime] = useState(profile?.availableTime || '');

  // Modals for Selection
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState(''); // 'primarySport', 'secondarySport', 'primaryLevel', 'secondaryLevel', 'days', 'time'

  // Prevent screenshot when zoom modal is open
  React.useEffect(() => {
    let subscription;
    const preventScreenshot = async () => {
      if (zoomModalVisible) {
        await ScreenCapture.preventScreenCaptureAsync();
        subscription = ScreenCapture.addScreenshotListener(() => {
          Alert.alert("Dilarang", "Tangkapan layar dinonaktifkan demi privasi.");
        });
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    };
    preventScreenshot();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      if (subscription) {
        subscription.remove();
      }
    };
  }, [zoomModalVisible]);
  
  // Temp states for multi-select and complex selection
  const [tempDays, setTempDays] = useState([]);
  const [tempTimeStart, setTempTimeStart] = useState('08:00');
  const [tempTimeEnd, setTempTimeEnd] = useState('10:00');

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Fetch user profile stats here when API is ready
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const openSelection = (type) => {
    setSelectionType(type);
    if (type === 'days') {
      const existing = (availableDays || '').split(', ').filter(d => daysOptions.includes(d));
      setTempDays(existing);
    } else if (type === 'time') {
      const parts = (availableTime || '').split(' - ');
      if (parts.length === 2) {
        setTempTimeStart(parts[0]);
        setTempTimeEnd(parts[1]);
      }
    }
    
    // Sembunyikan Edit Profile Modal terlebih dahulu agar Modal Selection bisa diklik di Android
    if (type !== 'language') {
      setModalVisible(false);
      setTimeout(() => setSelectionModalVisible(true), 150);
    } else {
      setSelectionModalVisible(true);
    }
  };

  const closeSelectionAndReopenEdit = () => {
    setSelectionModalVisible(false);
    if (selectionType !== 'language') {
      setTimeout(() => setModalVisible(true), 150);
    }
  };

  const handleSelectOption = (value) => {
    if (selectionType === 'primarySport') setPrimarySport(value);
    if (selectionType === 'secondarySport') setSecondarySport(value);
    if (selectionType === 'primaryLevel') setPrimaryLevel(value);
    if (selectionType === 'secondaryLevel') setSecondaryLevel(value);
    if (selectionType === 'language') setLanguage(value);
    closeSelectionAndReopenEdit();
  };

  const toggleDay = (day) => {
    if (tempDays.includes(day)) {
      setTempDays(tempDays.filter(d => d !== day));
    } else {
      if (tempDays.length < 7) {
        setTempDays([...tempDays, day]);
      } else {
        setAlertConfig({ visible: true, title: t('alert_limit_days_title'), message: t('alert_limit_days_msg') });
      }
    }
  };

  const saveDays = () => {
    if (tempDays.length === 0) {
      setAlertConfig({ visible: true, title: t('alert_empty_days_title'), message: t('alert_empty_days_msg') });
      return;
    }
    const sortedDays = [...tempDays].sort((a, b) => {
      return daysOptions.indexOf(a) - daysOptions.indexOf(b);
    });
    setAvailableDays(sortedDays.join(', '));
    closeSelectionAndReopenEdit();
  };

  const saveTime = () => {
    setAvailableTime(`${tempTimeStart} - ${tempTimeEnd}`);
    closeSelectionAndReopenEdit();
  };

  const takenUsernames = ['@dewa_permana99', '@alex_sterling', '@johndoe'];

  const handleUsernameChange = (text) => {
    let formattedText = text.toLowerCase().replace(/\s+/g, '_');
    if (formattedText.length > 0 && !formattedText.startsWith('@')) {
      formattedText = '@' + formattedText;
    }
    const cleanText = formattedText.replace(/[^@a-z0-9_]/g, '');
    setUsername(cleanText);
  };

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({ visible: true, title: t('alert_permission_denied_title'), message: t('alert_permission_denied_msg') });
        setIsFetchingLocation(false);
        return;
      }

      let locationData = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      let geocode = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const { city, subregion, region, country } = geocode[0];
        
        // Prioritaskan subregion (Kabupaten/Kota) daripada city (Kecamatan)
        let cityName = subregion || city || region || '';
        
        // Hapus embel-embel "Kabupaten", "Kota", atau "Kecamatan" agar lebih bersih
        cityName = cityName.replace(/^(Kabupaten|Kota|Kecamatan)\s+/i, '');
        
        const newLoc = cityName ? `${cityName}, ${country}` : country;
        setLocation(newLoc);
        setLatitude(locationData.coords.latitude);
        setLongitude(locationData.coords.longitude);
      }
    } catch (error) {
      setAlertConfig({ visible: true, title: t('alert_location_failed_title'), message: t('alert_location_failed_msg') });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSave = () => {
    if (username.length < 4) {
      setAlertConfig({ visible: true, title: t('alert_username_short_title'), message: t('alert_username_short_msg') });
      return;
    }

    // Jika username berubah, periksa apakah sudah dipakai
    if (username !== profile.username && takenUsernames.includes(username)) {
      setAlertConfig({ visible: true, title: t('alert_username_taken_title'), message: t('alert_username_taken_msg') });
      return;
    }

    if (!availableDays || availableDays.trim() === '') {
      setAlertConfig({ visible: true, title: t('alert_empty_days_title'), message: t('alert_empty_days_msg') });
      return;
    }

    updateProfile({
      fullName,
      username,
      location,
      latitude,
      longitude,
      primarySport,
      primaryLevel,
      secondarySport,
      secondaryLevel,
      availableDays,
      availableTime,
    });
    
    // Sync with backend API (Production Logic)
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    if (profile?.id) {
        fetch(`${API_URL}/users/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          latitude,
          longitude,
          full_name: fullName,
          primary_sport: primarySport,
          primary_level: primaryLevel,
          secondary_sport: secondarySport,
          secondary_level: secondaryLevel,
          available_days: availableDays,
          available_time: availableTime
        })
      })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          console.log("Save Profile Error Response:", res.status, errText);
          setAlertConfig({ visible: true, title: 'Error', message: 'Gagal menyimpan profil: ' + errText });
        }
      })
      .catch(err => {
        console.log("API Update Profile Error: ", err);
        setAlertConfig({ visible: true, title: 'Error', message: 'Koneksi gagal saat menyimpan profil.' });
      });
    }
    
    setModalVisible(false);
  };

  const selectAvatar = (url) => {
    const previousAvatar = profile.avatar; // Simpan avatar lama
    
    // Optimistic UI update
    updateProfile({ avatar: url });
    setAvatarModalVisible(false);
    
    // Sync avatar to backend
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    if (profile?.id) {
      if (url.startsWith('http')) {
        // If preset avatar (pravatar etc), just update the string in DB
        fetch(`${API_URL}/users/${profile?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: url })
        }).catch(err => {
          console.log("API Update Avatar Error: ", err);
          updateProfile({ avatar: previousAvatar }); // Revert
        });
      } else {
        // If local file, upload as multipart/form-data
        let formData = new FormData();
        let filename = url.split('/').pop() || 'avatar.jpg';
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('file', { uri: url, name: filename, type });
        
        fetch(`${API_URL}/users/${profile?.id}/avatar`, {
          method: 'POST',
          body: formData
        })
        .then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Server error: ${res.status} - ${errText}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.avatar_url) {
            // Update the state with the real server URL so it persists
            updateProfile({ avatar: data.avatar_url });
            setAlertConfig({ visible: true, title: 'Berhasil', message: 'Foto profil berhasil diunggah.' });
          }
        })
        .catch(err => {
          console.log("API Update Avatar File Error: ", err);
          updateProfile({ avatar: previousAvatar }); // Revert
          setAlertConfig({ 
            visible: true, 
            title: t('error') || 'Upload Gagal', 
            message: 'Terjadi kesalahan saat mengunggah foto profil Anda. Silakan coba beberapa saat lagi.' 
          });
        });
      }
    }
    setAvatarModalVisible(false);
  };

  const insets = useSafeAreaInsets();
  
  const getAvatarUrl = (avatarStr) => {
    if (!avatarStr || avatarStr === "null") return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    if (avatarStr.includes('gravatar.com') || avatarStr.startsWith('file://') || avatarStr.startsWith('content://')) return avatarStr;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    
    // Auto-fix any absolute URLs from previous local tests (e.g. 192.168.x.x, 10.0.2.2, etc.)
    let cleanStr = avatarStr;
    if (cleanStr.includes('/uploads/')) {
        const urlParts = cleanStr.split('/uploads/');
        if (urlParts.length > 1) {
            cleanStr = '/uploads/' + urlParts[1];
        }
    }

    try {
      const urlObj = new URL(cleanStr);
      return `${apiUrl}${urlObj.pathname}${urlObj.search}`;
    } catch (e) {
      return cleanStr.startsWith('/') ? `${apiUrl}${cleanStr}` : `${apiUrl}/${cleanStr}`;
    }
  };

  const handleLogout = () => {
    setLogoutConfirmVisible(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmVisible(false);
    logout();
    navigation.navigate('Auth');
  };

  if (!profile) return null; // Cegah crash saat profile direset menjadi null ketika proses logout

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4FF00"
              colors={['#D4FF00']}
              progressBackgroundColor="#161C26"
            />
          }
        >
          
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity onPress={() => setZoomModalVisible(true)}>
                <Image source={{ uri: getAvatarUrl(profile.avatar) }} style={styles.avatar} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editBadge}
                onPress={() => setAvatarModalVisible(true)}
              >
                <Feather name="camera" size={14} color="#0F1522" />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.location}>
              <Feather name="map-pin" size={12} /> {profile.location}
            </Text>

            <TouchableOpacity 
              style={styles.btnEditProfile} 
              onPress={() => {
                setFullName(profile.fullName);
                setUsername(profile.username);
                setLocation(profile.location);
                setPrimarySport(profile.primarySport);
                setPrimaryLevel(profile.primaryLevel);
                setSecondarySport(profile.secondarySport);
                setSecondaryLevel(profile.secondaryLevel);
                setAvailableDays(profile.availableDays);
                setAvailableTime(profile.availableTime);
                setModalVisible(true);
              }}
            >
              <Feather name="edit-3" size={14} color="#D4FF00" style={{ marginRight: 6 }} />
              <Text style={styles.btnEditProfileText}>{t('edit_profile')}</Text>
            </TouchableOpacity>
          </View>

          {/* Sport Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t('sports_information')}</Text>
            <View style={styles.card}>
              <View style={styles.textRow}>
                <Text style={styles.label}>{t('primary')}</Text>
                <Text style={styles.value}>
                  {t('sport_' + profile.primarySport.toLowerCase().replace(/ /g, '_'))} ({t(profile.primaryLevel.toLowerCase()).toUpperCase()})
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.textRow}>
                <Text style={styles.label}>{t('secondary')}</Text>
                <Text style={styles.value}>
                  {t('sport_' + profile.secondarySport.toLowerCase().replace(/ /g, '_'))} ({t(profile.secondaryLevel.toLowerCase()).toUpperCase()})
                </Text>
              </View>
            </View>
          </View>

          {/* Trust & Reputation */}
          <View style={styles.section}>
            <View style={styles.reputationHeader}>
              <Text style={styles.sectionTitle}>{t('trust_reputation')}</Text>
              <View style={styles.systemBadge}>
                <Feather name="shield" size={10} color="#D4FF00" style={{ marginRight: 4 }} />
                <Text style={styles.systemBadgeText}>{t('system_calculated')}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreTitle}>{t('trust_score')}</Text>
                  <Text style={styles.scoreDesc}>{t('trust_desc')}</Text>
                </View>
                <Text style={[styles.scoreValue, { color: '#D4FF00' }]}>{profile.trustScore}/100</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreTitle}>{t('sportsmanship')}</Text>
                  <Text style={styles.scoreDesc}>{t('sportsmanship_desc')}</Text>
                </View>
                <Text style={[styles.scoreValue, { color: '#A0BEFF' }]}>{profile.sportsmanship.toFixed(1)}/5.0</Text>
              </View>
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t('availability')}</Text>
            <View style={styles.card}>
              <View style={styles.textRow}>
                <Text style={styles.label}>{t('days')}</Text>
                <Text style={styles.value}>
                  {profile.availableDays.split(', ').map(day => t(day.toLowerCase())).join(', ')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.textRow}>
                <Text style={styles.label}>{t('time')}</Text>
                <Text style={styles.value}>{profile.availableTime}</Text>
              </View>
            </View>
          </View>

          {/* App Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t('app_preferences')}</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.textRow} onPress={() => openSelection('language')}>
                <Text style={styles.label}>{t('language')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <Text style={styles.value}>{language}</Text>
                  <Feather name="chevron-right" size={16} color="#8A95A5" style={{ marginLeft: 5 }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
            <Feather name="log-out" size={18} color="#0F1522" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Profile Edit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('edit_profile_info')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Text style={styles.inputLabel}>{t('full_name')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter Full Name"
                  placeholderTextColor="#5C677D"
                />

                <Text style={styles.inputLabel}>{t('username')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="e.g. @username"
                  placeholderTextColor="#5C677D"
                  autoCapitalize="none"
                />

                <View style={styles.locationHeaderRow}>
                  <Text style={[styles.inputLabel, { marginTop: 0, marginBottom: 0 }]}>{t('location')}</Text>
                  <TouchableOpacity onPress={handleGetLocation} disabled={isFetchingLocation}>
                    {isFetchingLocation ? (
                      <ActivityIndicator size="small" color="#D4FF00" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="navigation" size={14} color="#D4FF00" />
                        <Text style={{ color: '#D4FF00', fontSize: 12, marginLeft: 4, fontWeight: 'bold' }}>{t('auto_detect')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Jakarta, Indonesia"
                  placeholderTextColor="#5C677D"
                />

                <Text style={styles.inputLabel}>{t('primary_sport')}</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => openSelection('primarySport')}>
                  <Text style={styles.dropdownText}>{primarySport ? t('sport_' + primarySport.toLowerCase().replace(/ /g, '_')) : t('select_sport')}</Text>
                  <Feather name="chevron-down" size={18} color="#8A95A5" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('primary_level')}</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => openSelection('primaryLevel')}>
                  <Text style={styles.dropdownText}>{primaryLevel ? t(primaryLevel.toLowerCase()).toUpperCase() : t('select_level')}</Text>
                  <Feather name="chevron-down" size={18} color="#8A95A5" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('secondary_sport')}</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => openSelection('secondarySport')}>
                  <Text style={styles.dropdownText}>{secondarySport ? t('sport_' + secondarySport.toLowerCase().replace(/ /g, '_')) : t('select_sport')}</Text>
                  <Feather name="chevron-down" size={18} color="#8A95A5" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('secondary_level')}</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => openSelection('secondaryLevel')}>
                  <Text style={styles.dropdownText}>{secondaryLevel ? t(secondaryLevel.toLowerCase()).toUpperCase() : t('select_level')}</Text>
                  <Feather name="chevron-down" size={18} color="#8A95A5" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('available_days')}</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => openSelection('days')}>
                  <Text style={styles.dropdownText}>{availableDays ? availableDays.split(', ').map(d => t(d.toLowerCase())).join(', ') : t('select_days')}</Text>
                  <Feather name="chevron-down" size={18} color="#8A95A5" />
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('available_time')}</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => openSelection('time')}>
                  <Text style={styles.dropdownText}>{availableTime || t('select_time_range')}</Text>
                  <Feather name="chevron-down" size={18} color="#8A95A5" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                  <Text style={styles.btnSaveText}>{t('save_changes')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Avatar Zoom Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={zoomModalVisible}
          onRequestClose={() => setZoomModalVisible(false)}
        >
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={styles.zoomModalOverlay}>
              <View style={styles.zoomModalHeader}>
                <TouchableOpacity onPress={() => setZoomModalVisible(false)} style={styles.zoomHeaderIcon}>
                  <Feather name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => {
                  setAvatarModalVisible(true);
                }} style={styles.zoomHeaderIcon}>
                  <Feather name="edit-2" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.zoomImageContainer}>
                <ZoomableImage uri={getAvatarUrl(profile.avatar)} />
              </View>
            </View>
          </GestureHandlerRootView>
        </Modal>

        {/* Avatar Selection Modal (Bottom Sheet) */}
        <AvatarBottomSheet
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
          onUpdateAvatar={selectAvatar}
          t={t}
          setAlertConfig={setAlertConfig}
          setZoomModalVisible={setZoomModalVisible}
        />

        {/* Selection Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={selectionModalVisible}
          onRequestClose={() => setSelectionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '75%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectionType === 'language' ? t('select_language') : 
                   selectionType.includes('Sport') ? t('select_sport') : 
                   selectionType.includes('Level') ? t('select_level') : 
                   selectionType === 'days' ? t('select_days') : t('select_time_range')}
                </Text>
                <TouchableOpacity onPress={closeSelectionAndReopenEdit}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.selectionScroll}>
                {selectionType.includes('Sport') && (
                  <View style={styles.selectionGrid}>
                    {allSports.map(sport => {
                      const isActive = (selectionType === 'primarySport' && primarySport === sport.name) || 
                                       (selectionType === 'secondarySport' && secondarySport === sport.name);
                      return (
                        <TouchableOpacity 
                          key={sport.id} 
                          style={styles.selectionSportItem}
                          onPress={() => handleSelectOption(sport.name)}
                        >
                          <View style={[styles.selectionSportIcon, isActive && styles.selectionSportIconActive]}>
                            <MaterialCommunityIcons name={sport.icon} size={28} color={isActive ? '#000' : '#8A95A5'} />
                          </View>
                          <Text style={[styles.selectionSportText, isActive && styles.selectionSportTextActive]}>{t('sport_' + sport.name.toLowerCase().replace(/ /g, '_'))}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {selectionType.includes('Level') && (
                  <View style={{ gap: 10 }}>
                    {levelOptions.map(level => (
                      <TouchableOpacity 
                        key={level} 
                        style={styles.selectionListItem}
                        onPress={() => handleSelectOption(level)}
                      >
                        <Text style={styles.selectionListText}>{t(level.toLowerCase()).toUpperCase()}</Text>
                        <Feather name="chevron-right" size={18} color="#8A95A5" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectionType === 'days' && (
                  <View style={{ gap: 10 }}>
                    <Text style={{ color: '#8A95A5', marginBottom: 10, fontSize: 12 }}>{t('select_up_to_7_days')}</Text>
                    {daysOptions.map(day => {
                      const isSelected = tempDays.includes(day);
                      return (
                        <TouchableOpacity 
                          key={day} 
                          style={[styles.selectionListItem, isSelected && { borderColor: '#D4FF00', backgroundColor: '#1C2E2A' }]}
                          onPress={() => toggleDay(day)}
                        >
                          <Text style={[styles.selectionListText, isSelected && { color: '#D4FF00', fontWeight: 'bold' }]}>{t(day.toLowerCase())}</Text>
                          {isSelected && <Feather name="check" size={18} color="#D4FF00" />}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity style={styles.btnSave} onPress={saveDays}>
                      <Text style={styles.btnSaveText}>{t('save_days')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectionType === 'time' && (
                  <View>
                    <Text style={{ color: '#8A95A5', marginBottom: 15, fontSize: 12 }}>{t('select_free_time')}</Text>
                    
                    <Text style={styles.inputLabel}>{t('start_time')}</Text>
                    <View style={styles.timeGrid}>
                      {timeOptions.map(t => (
                        <TouchableOpacity 
                          key={`start-${t}`}
                          style={[styles.timeOption, tempTimeStart === t && styles.timeOptionActive]}
                          onPress={() => setTempTimeStart(t)}
                        >
                          <Text style={[styles.timeOptionText, tempTimeStart === t && styles.timeOptionTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: 20 }]}>{t('end_time')}</Text>
                    <View style={styles.timeGrid}>
                      {timeOptions.map(t => (
                        <TouchableOpacity 
                          key={`end-${t}`}
                          style={[styles.timeOption, tempTimeEnd === t && styles.timeOptionActive]}
                          onPress={() => setTempTimeEnd(t)}
                        >
                          <Text style={[styles.timeOptionText, tempTimeEnd === t && styles.timeOptionTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.btnSave} onPress={saveTime}>
                      <Text style={styles.btnSaveText}>{t('save_time')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectionType === 'language' && (
                  <View style={{ gap: 10 }}>
                    <Text style={{ color: '#8A95A5', marginBottom: 10, fontSize: 12 }}>{t('select_language')}</Text>
                    {['English (US)', 'Bahasa Indonesia', 'Español', 'Français', '中文 (Chinese)'].map(lang => (
                      <TouchableOpacity 
                        key={lang} 
                        style={styles.selectionListItem}
                        onPress={() => handleSelectOption(lang)}
                      >
                        <Text style={styles.selectionListText}>{lang}</Text>
                        {language === lang ? <Feather name="check" size={18} color="#D4FF00" /> : <Feather name="chevron-right" size={18} color="#8A95A5" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <CustomAlert 
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        />

        <CustomConfirmAlert 
          visible={logoutConfirmVisible}
          title={t('logout_confirm_title')}
          message={t('logout_confirm_desc')}
          cancelText={t('cancel')}
          confirmText={t('yes')}
          onCancel={() => setLogoutConfirmVisible(false)}
          onConfirm={confirmLogout}
        />

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 35, borderBottomWidth: 1, borderBottomColor: '#1C2433', marginBottom: 20 },
  
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#D4FF00' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D4FF00',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F1522',
  },
  
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  username: { fontSize: 14, color: '#A0BEFF', marginBottom: 5, fontWeight: 'bold' },
  location: { fontSize: 14, color: '#8A95A5', marginBottom: 15 },
  
  btnEditProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2433',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  btnEditProfileText: { color: '#D4FF00', fontSize: 13, fontWeight: 'bold' },

  section: { paddingHorizontal: 20, marginBottom: 25 },
  reputationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#5C677D', textTransform: 'uppercase', letterSpacing: 1 },
  systemBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2E4A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  systemBadgeText: { color: '#D4FF00', fontSize: 9, fontWeight: 'bold' },

  card: { backgroundColor: '#121824', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#233045' },
  textRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { fontSize: 15, color: '#8A95A5', marginRight: 15, flexShrink: 0, marginTop: 2 },
  value: { fontSize: 15, color: '#FFF', fontWeight: '600', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#1C2433', marginVertical: 15 },
  
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreTitle: { fontSize: 16, color: '#FFF', fontWeight: '600', marginBottom: 2 },
  scoreDesc: { fontSize: 11, color: '#5C677D' },
  scoreValue: { fontSize: 20, fontWeight: 'bold' },
  
  logoutBtn: { marginHorizontal: 20, marginTop: 10, backgroundColor: '#FF6B6B', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#0F1522', fontSize: 16, fontWeight: 'bold' },

  // Zoom Modal Styles
  zoomModalOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  zoomModalHeader: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 20, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    zIndex: 10
  },
  zoomHeaderIcon: { padding: 10, backgroundColor: 'rgba(28,36,51,0.6)', borderRadius: 20 },
  zoomModalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  zoomImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  zoomedAvatar: { width: '100%', height: '100%' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#161C26', width: '90%', maxHeight: '80%', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2D3748' },
  avatarModalContent: { backgroundColor: '#161C26', width: '90%', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2D3748' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#2D3748', paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalScroll: { paddingBottom: 20 },
  
  inputLabel: { color: '#8A95A5', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 8 },
  textInput: { backgroundColor: '#1C2433', color: '#FFF', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2D3748', fontSize: 16 },
  
  dropdownInput: {
    backgroundColor: '#1C2433', 
    paddingHorizontal: 15, 
    paddingVertical: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#2D3748',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dropdownText: { color: '#FFF', fontSize: 15, flex: 1, marginRight: 10 },

  btnSave: { backgroundColor: '#D4FF00', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  btnSaveText: { color: '#000', fontSize: 16, fontWeight: 'bold' },

  // Selection Modal Styles
  selectionScroll: { paddingBottom: 20 },
  selectionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  selectionSportItem: { width: '22%', alignItems: 'center', marginBottom: 20 },
  selectionSportIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1C2433', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#2D3748' },
  selectionSportIconActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  selectionSportText: { color: '#8A95A5', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  selectionSportTextActive: { color: '#FFF', fontWeight: 'bold' },
  selectionListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C2433', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#2D3748' },
  selectionListText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeOption: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#1C2433', borderRadius: 8, borderWidth: 1, borderColor: '#2D3748' },
  timeOptionActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  timeOptionText: { color: '#C2D0E8', fontSize: 12, fontWeight: 'bold' },
  timeOptionTextActive: { color: '#0F1522' },

});
