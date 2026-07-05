import React, { useState, useContext, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';
import { Image } from 'expo-image';

const getSportIcon = (sportName) => {
  if (!sportName) return 'badminton';
  const s = String(sportName).toLowerCase();
  if (s.includes('basket')) return 'basketball';
  if (s.includes('futsal') || s.includes('soccer') || s.includes('football') || s.includes('bola')) return 'soccer';
  if (s.includes('tennis') || s.includes('tenis')) return 'tennis';
  if (s.includes('ping') || s.includes('table')) return 'table-tennis';
  if (s.includes('voli') || s.includes('volley')) return 'volleyball';
  return 'badminton';
};

const getAvatarUrl = (str) => {
  if (!str || str === "null") return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
  if (str.includes('gravatar.com') || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('file://') || str.startsWith('content://')) {
    // Cache buster to prevent stale images after upload (only for non-gravatar)
    if (str.startsWith('http') && !str.includes('gravatar.com')) {
       return `${str}?t=${Date.now()}`;
    }
    return str;
  }
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
  const cleanPath = str.startsWith('/') ? str : `/${str}`;
  return `${API_URL}${cleanPath}?t=${Date.now()}`;
};

export default function CreateChallengeScreen({ navigation, route }) {
  const { profile, t, language, selectedOpponent } = useAppStore();
  
  // Prioritize route params (fresh click) over Zustand's global state
  const opponent = route.params?.opponent || selectedOpponent || {
    name: 'Marcus Vane',
    elo: 1520,
    level: 'EXPERT',
    avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    isPro: true
  };

  const [opponentData, setOpponentData] = useState(opponent);

  React.useEffect(() => {
    let intervalId;
    const fetchOpponentData = async () => {
      if (!opponentData.id || opponentData.id === '0') return;
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await fetch(`${apiUrl}/users/${opponentData.id}?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setOpponentData(prev => ({
            ...prev,
            ...data,
            name: data.full_name || data.username || prev.name,
            level: data.primary_level || prev.level,
            sports: [data.primary_sport, data.secondary_sport].filter(Boolean)
          }));
        }
      } catch (err) {}
    };
    fetchOpponentData();
    intervalId = setInterval(fetchOpponentData, 2000);
    return () => clearInterval(intervalId);
  }, [opponentData.id]);

  const availableSports = [
    opponentData.primarySport || opponentData.primary_sport || (opponentData.sports && opponentData.sports[0]),
    opponentData.secondarySport || opponentData.secondary_sport || (opponentData.sports && opponentData.sports[1])
  ].filter(Boolean);
  
  const [activeSport, setActiveSport] = useState(availableSports[0] || 'Badminton');

  React.useEffect(() => {
    if (availableSports.length > 0 && !availableSports.includes(activeSport)) {
      setActiveSport(availableSports[0]);
    }
  }, [availableSports.join(',')]);
  
  // Date & Time Picker State
  const [matchDate, setMatchDate] = useState(new Date());
  const [matchEndDate, setMatchEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
  const [pickerMode, setPickerMode] = useState('date');
  const [showPicker, setShowPicker] = useState(false);
  const [activePickerType, setActivePickerType] = useState('start'); // 'start' or 'end'

  const [activeVenue, setActiveVenue] = useState(null);
  const [isCompetitive, setIsCompetitive] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setShowLocationError(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => {
      setShowLocationError(false);
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      const tempVenue = useAppStore.getState().tempVenue;
      if (tempVenue) {
        setActiveVenue(tempVenue);
        useAppStore.getState().setTempVenue(null);
      }
    }, [])
  );

  const handleSendChallenge = async () => {
    if (!activeVenue) {
      showToast();
      return;
    }
    
    setIsSending(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/challenges/?challenger_id=${profile?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent_id: opponent.id,
          sport: activeSport,
          match_date: matchDate.toISOString(),
          match_end_date: matchEndDate.toISOString(),
          venue_name: activeVenue.name,
          venue_lat: activeVenue.lat || 0,
          venue_lon: activeVenue.lon || 0,
          is_competitive: isCompetitive
        })
      });

      if (response.ok) {
        useAppStore.getState().setHasNewMatches(true);
        setIsSent(true);
        setShowSuccessModal(true);
        // Do not set isSending to false here so the button doesn't flicker back
      } else {
        console.error('Failed to send challenge');
        setIsSending(false);
      }
    } catch (err) {
      console.error(err);
      setIsSending(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigation.navigate('Main', { screen: 'Home' });
  };

  const onChangeDateTime = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    // Note: On iOS, we keep it open until 'Done' is pressed
    if (selectedDate) {
      if (activePickerType === 'start') {
        setMatchDate(selectedDate);
        // Ensure end date is always after start date
        if (selectedDate >= matchEndDate) {
          setMatchEndDate(new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000));
        }
      } else {
        setMatchEndDate(selectedDate);
      }
    }
  };

  const showMode = (currentMode, type = 'start') => {
    if (Platform.OS === 'web') {
      alert(t('feature_unavailable') + ': Date & Time picker requires a mobile device (Android/iOS). For testing on web, a default time will be used.');
      return;
    }
    setActivePickerType(type);
    setPickerMode(currentMode);
    setShowPicker(true);
  };

  // Format Helpers
  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('create_challenge')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Opponent Card */}
          <View style={styles.opponentCard}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: getAvatarUrl(opponent.avatar) }} style={styles.avatar} />
              {opponent.isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.opponentInfo}>
              <Text style={styles.opponentName}>{opponent.name}</Text>
              <View style={styles.opponentStats}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{opponent.level}</Text>
                </View>
                <Text style={styles.eloText}><Text style={{ color: '#8A95A5', fontSize: 10, fontWeight: 'normal' }}>ELO</Text> {opponent.elo}</Text>
              </View>
            </View>
            <Feather name="award" size={28} color="#D4FF00" />
          </View>

          {/* Select Sport */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sports_category').toUpperCase()}</Text>
            <View style={styles.sportRow}>
              {(availableSports.length > 0 ? availableSports : ['Badminton']).map((sport) => (
                <TouchableOpacity 
                  key={sport} 
                  style={[styles.sportBtn, activeSport === sport && styles.sportBtnActive, { flexDirection: 'row' }]}
                  onPress={() => setActiveSport(sport)}
                >
                  <MaterialCommunityIcons 
                    name={getSportIcon(sport)} 
                    size={16} 
                    color={activeSport === sport ? '#0F1522' : '#8A95A5'} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.sportText, activeSport === sport && styles.sportTextActive]}>{sport.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date & Time Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('date_time').toUpperCase()}</Text>
            
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showMode('date', 'start')}>
                <Feather name="calendar" size={20} color="#D4FF00" style={{ marginBottom: 8 }} />
                <Text style={styles.dateTimeLabel}>{t('days')}</Text>
                <Text style={styles.dateTimeValue}>{formatDate(matchDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showMode('time', 'start')}>
                <Feather name="clock" size={20} color="#D4FF00" style={{ marginBottom: 8 }} />
                <Text style={styles.dateTimeLabel}>{t('start')}</Text>
                <Text style={styles.dateTimeValue}>{formatTime(matchDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showMode('time', 'end')}>
                <Feather name="clock" size={20} color="#FF4D4D" style={{ marginBottom: 8 }} />
                <Text style={styles.dateTimeLabel}>{t('end')}</Text>
                <Text style={styles.dateTimeValue}>{formatTime(matchEndDate)}</Text>
              </TouchableOpacity>
            </View>

            {showPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={activePickerType === 'start' ? matchDate : matchEndDate}
                mode={pickerMode}
                is24Hour={true}
                display="default"
                onChange={onChangeDateTime}
                minimumDate={activePickerType === 'end' ? matchDate : new Date(new Date().setHours(0,0,0,0))}
              />
            )}

            <Modal visible={showPicker && Platform.OS === 'ios'} transparent={true} animationType="slide">
              <View style={styles.iosPickerOverlay}>
                <View style={styles.iosPickerContainer}>
                  <View style={styles.iosPickerHeader}>
                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                      <Text style={styles.iosPickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={activePickerType === 'start' ? matchDate : matchEndDate}
                    mode={pickerMode}
                    is24Hour={true}
                    display="spinner"
                    onChange={onChangeDateTime}
                    minimumDate={activePickerType === 'end' ? matchDate : new Date(new Date().setHours(0,0,0,0))}
                    textColor="#FFF"
                    themeVariant="dark"
                  />
                </View>
              </View>
            </Modal>
          </View>

          {/* Select Venue */}
          <View style={styles.section}>
            <View style={styles.venueHeader}>
              <Text style={styles.sectionTitle}>{t('select_venue').toUpperCase()}</Text>
              <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('VenueMap', { returnScreen: 'CreateChallenge' })}>
                <Feather name="map" size={12} color="#D4FF00" style={{ marginRight: 4 }} />
                <Text style={styles.mapBtnText}>{t('map_view')}</Text>
              </TouchableOpacity>
            </View>

            {activeVenue ? (
              <View style={[styles.venueCard, styles.venueCardActive]}>
                <View style={[styles.venueIconBox, { backgroundColor: '#B9DE00' }]}>
                  <Feather name="map-pin" size={16} color="#0F1522" />
                </View>
                <View style={styles.venueInfo}>
                  <Text style={[styles.venueName, styles.venueTextActive]}>{activeVenue.name}</Text>
                  <Text style={[styles.venueDesc, { color: '#0F1522' }]}>{activeVenue.distance} • {activeVenue.type}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.emptyVenueCard} onPress={() => navigation.navigate('VenueMap', { returnScreen: 'CreateChallenge' })}>
                <Feather name="map-pin" size={24} color="#8A95A5" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyVenueText}>{t('no_venue_selected')}</Text>
                <Text style={styles.emptyVenueSubtext}>{t('pick_location_desc')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Match Stakes */}
          <View style={styles.stakesCard}>
            <View style={styles.stakesInfo}>
              <Text style={styles.stakesTitle}>{t('match_stakes')}</Text>
              <Text style={styles.stakesDesc}>{t('stakes_desc')}</Text>
            </View>
            <View style={styles.stakesToggle}>
              <TouchableOpacity 
                style={[styles.toggleBtn, !isCompetitive && styles.toggleBtnActive]}
                onPress={() => setIsCompetitive(false)}
              >
                <Text style={[styles.toggleText, !isCompetitive && styles.toggleTextActive]}>{t('friendly')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, isCompetitive && styles.toggleBtnActive]}
                onPress={() => setIsCompetitive(true)}
              >
                <Text style={[styles.toggleText, isCompetitive && styles.toggleTextActive]}>{t('competitive')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.sendBtn, isSent && { backgroundColor: '#1C2433', borderColor: '#D4FF00', borderWidth: 1 }]} 
            onPress={handleSendChallenge} 
            disabled={isSending || isSent}
          >
            <Text style={[styles.sendBtnText, isSent && { color: '#D4FF00' }]}>
              {isSent ? t('sent_btn') : (isSending ? 'SENDING...' : t('send_challenge').toUpperCase())}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Error Toast */}
        {showLocationError && (
          <Animated.View style={[styles.errorToast, { opacity: toastOpacity }]}>
            <Feather name="alert-circle" size={18} color="#0F1522" style={{ marginRight: 8 }} />
            <Text style={styles.errorToastText}>
              {language === 'Bahasa Indonesia' ? 'Silakan pilih lokasi (Venue) terlebih dahulu!' : 'Please pick a location (Venue) first!'}
            </Text>
          </Animated.View>
        )}

        {/* Success Modal */}
        <Modal visible={showSuccessModal} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconBox}>
                <Feather name="check-circle" size={50} color="#D4FF00" />
              </View>
              <Text style={styles.modalTitle}>{t('challenge_sent')}</Text>
              <Text style={styles.modalDesc}>
                {t('challenge_sent_desc')}
                <Text style={{ color: '#D4FF00', fontWeight: 'bold' }}>{opponent.name}</Text>.
              </Text>
              <TouchableOpacity style={styles.modalBtn} onPress={handleCloseSuccessModal}>
                <Text style={styles.modalBtnText}>{t('awesome_btn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1C2433' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  scrollContent: { padding: 20 },
  
  // Opponent Card
  opponentCard: { flexDirection: 'row', backgroundColor: '#161C26', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2D3748', marginBottom: 25 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#D4FF00' },
  proBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#D4FF00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 2, borderColor: '#161C26' },
  proText: { fontSize: 9, fontWeight: '900', color: '#0F1522' },
  opponentInfo: { flex: 1 },
  opponentName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  opponentStats: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: { backgroundColor: '#1C2433', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 10, borderWidth: 1, borderColor: '#2D3748' },
  levelText: { color: '#D4FF00', fontSize: 10, fontWeight: 'bold' },
  eloText: { color: '#FFF', fontSize: 18, fontWeight: '900' },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#8A95A5', letterSpacing: 1.5, marginBottom: 15 },
  
  // Sport Selection
  sportRow: { flexDirection: 'row', gap: 10 },
  sportBtn: { flex: 1, backgroundColor: '#1C2433', paddingVertical: 12, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2D3748' },
  sportBtnActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  sportText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, includeFontPadding: false, textAlignVertical: 'center' },
  sportTextActive: { color: '#0F1522' },

  // Date & Time Picker
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  dateTimeBtn: { flex: 1, backgroundColor: '#1C2433', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2D3748' },
  dateTimeLabel: { fontSize: 11, color: '#8A95A5', fontWeight: 'bold', marginBottom: 4 },
  dateTimeValue: { fontSize: 12, fontWeight: '900', color: '#FFF', textAlign: 'center' },

  // Venues
  venueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  mapBtn: { flexDirection: 'row', alignItems: 'center' },
  mapBtnText: { color: '#D4FF00', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  
  venueCard: { flexDirection: 'row', backgroundColor: '#1C2433', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#2D3748' },
  venueCardActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  venueIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#2D3748', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  venueDesc: { fontSize: 12, color: '#8A95A5' },
  venueTextActive: { color: '#0F1522' },
  venueStatus: { fontSize: 10, fontWeight: 'bold', color: '#8A95A5', letterSpacing: 1 },
  emptyVenueCard: {
    backgroundColor: '#161C26',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center' },
  emptyVenueText: { fontSize: 14, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  emptyVenueSubtext: { fontSize: 11, color: '#8A95A5' },

  // Stakes
  stakesCard: { flexDirection: 'row', backgroundColor: '#161C26', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2D3748', justifyContent: 'space-between' },
  stakesInfo: { flex: 1, paddingRight: 15 },
  stakesTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  stakesDesc: { fontSize: 11, color: '#8A95A5', lineHeight: 16 },
  stakesToggle: { flexDirection: 'row', backgroundColor: '#1C2433', borderRadius: 25, padding: 4 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toggleBtnActive: { backgroundColor: '#D4FF00' },
  toggleText: { fontSize: 11, fontWeight: 'bold', color: '#8A95A5' },
  toggleTextActive: { color: '#0F1522' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0A0F18', borderTopWidth: 1, borderTopColor: '#1C2433' },
  sendBtn: { backgroundColor: '#D4FF00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  sendBtnText: { color: '#0F1522', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // iOS Picker Styles
  iosPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  iosPickerContainer: { backgroundColor: '#1C2433', paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  iosPickerDone: { color: '#D4FF00', fontSize: 16, fontWeight: 'bold' },

  // Success Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161C26', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#2D3748' },
  modalIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 255, 0, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 255, 0, 0.3)' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 10, letterSpacing: 1 },
  modalDesc: { fontSize: 14, color: '#8A95A5', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  modalBtn: { backgroundColor: '#D4FF00', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#0F1522', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // Error Toast
  errorToast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#D4FF00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#D4FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  errorToastText: {
    color: '#0F1522',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
