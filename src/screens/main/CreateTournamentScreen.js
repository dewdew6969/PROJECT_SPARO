import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';

export default function CreateTournamentScreen({ navigation, route }) {
  const { t } = useAppStore();
  
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Badminton');
  const [date, setDate] = useState(new Date(new Date().getTime() + 24 * 60 * 60 * 1000)); // Default tomorrow
  
  const [activeVenue, setActiveVenue] = useState(null);
  
  const [maxParticipants, setMaxParticipants] = useState('16');

  useFocusEffect(
    React.useCallback(() => {
      const tempVenue = useAppStore.getState().tempVenue;
      if (tempVenue) {
        setActiveVenue(tempVenue);
        useAppStore.getState().setTempVenue(null);
      }
    }, [])
  );
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name || !activeVenue || !maxParticipants) {
      if (Platform.OS === 'android') {
        import('react-native').then(({ ToastAndroid }) => ToastAndroid.show('Please fill name, venue, and max participants', ToastAndroid.SHORT));
      } else {
        alert('Please fill name, venue, and max participants');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/tournaments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          sport: sport,
          date: date.toISOString(),
          location: activeVenue.name,
          max_participants: parseInt(maxParticipants, 10) || 0
        })
      });

      if (response.ok) {
        if (Platform.OS === 'android') {
          import('react-native').then(({ ToastAndroid }) => ToastAndroid.show('Tournament Created!', ToastAndroid.SHORT));
        }
        navigation.goBack(); // Return to dashboard
      } else {
        console.error('Failed to create tournament');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangeDateTime = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showMode = (currentMode) => {
    if (Platform.OS === 'web') {
      alert(t('feature_unavailable') + ': Date & Time picker requires a mobile device (Android/iOS).');
      return;
    }
    setPickerMode(currentMode);
    setShowPicker(true);
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (d) => {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Tournament</Text>
            <View style={{ width: 24 }} />
          </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TOURNAMENT NAME</Text>
            <View style={styles.inputBox}>
              <Feather name="award" size={20} color="#8A95A5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Sparo National Cup"
                placeholderTextColor="#8A95A5"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SPORTS CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {['Badminton', 'Futsal', 'Basketball', 'Volleyball', 'Tennis', 'Billiards', 'Ping Pong', 'Mini Soccer', 'E-Sports', 'Chess', 'Golf', 'Running', 'Cycling', 'Swimming', 'Gym'].map((s) => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.sportBtn, sport === s && styles.sportBtnActive]}
                  onPress={() => setSport(s)}
                >
                  <Text style={[styles.sportText, sport === s && styles.sportTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATE & TIME</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showMode('date')}>
                <Feather name="calendar" size={20} color="#D4FF00" style={{ marginBottom: 8 }} />
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showMode('time')}>
                <Feather name="clock" size={20} color="#D4FF00" style={{ marginBottom: 8 }} />
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{formatTime(date)}</Text>
              </TouchableOpacity>
            </View>

            {showPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={date}
                mode={pickerMode}
                is24Hour={true}
                display="default"
                onChange={onChangeDateTime}
                minimumDate={new Date(new Date().setHours(0,0,0,0))}
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
                    value={date}
                    mode={pickerMode}
                    is24Hour={true}
                    display="spinner"
                    onChange={onChangeDateTime}
                    minimumDate={new Date(new Date().setHours(0,0,0,0))}
                    textColor="#FFF"
                    themeVariant="dark"
                  />
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.section}>
            <View style={styles.venueHeader}>
              <Text style={styles.sectionTitle}>{t('select_venue')?.toUpperCase() || 'VENUE LOCATION'}</Text>
              <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('VenueMap', { returnScreen: 'CreateTournament' })}>
                <Feather name="map" size={12} color="#D4FF00" style={{ marginRight: 4 }} />
                <Text style={styles.mapBtnText}>{t('map_view') || 'MAP VIEW'}</Text>
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
              <TouchableOpacity style={styles.emptyVenueCard} onPress={() => navigation.navigate('VenueMap', { returnScreen: 'CreateTournament' })}>
                <Feather name="map-pin" size={24} color="#8A95A5" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyVenueText}>{t('no_venue_selected') || 'No Venue Selected'}</Text>
                <Text style={styles.emptyVenueSubtext}>{t('pick_location_desc') || 'Tap to pick a location'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MAX PARTICIPANTS</Text>
            <View style={styles.inputBox}>
              <Feather name="users" size={20} color="#8A95A5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 16"
                placeholderTextColor="#8A95A5"
                keyboardType="numeric"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.sendBtn} onPress={handleCreate} disabled={isSubmitting}>
            <Text style={styles.sendBtnText}>{isSubmitting ? 'CREATING...' : 'CREATE TOURNAMENT'}</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
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
  
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#8A95A5', letterSpacing: 1.5, marginBottom: 15 },
  
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2433', borderRadius: 12, borderWidth: 1, borderColor: '#2D3748', paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 15, paddingVertical: 15 },
  
  sportBtn: { backgroundColor: '#1C2433', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#2D3748' },
  sportBtnActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  sportText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  sportTextActive: { color: '#0F1522' },

  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  dateTimeBtn: { flex: 1, backgroundColor: '#1C2433', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2D3748' },
  dateTimeLabel: { fontSize: 11, color: '#8A95A5', fontWeight: 'bold', marginBottom: 4 },
  dateTimeValue: { fontSize: 13, fontWeight: '900', color: '#FFF', textAlign: 'center' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0A0F18', borderTopWidth: 1, borderTopColor: '#1C2433' },
  sendBtn: { backgroundColor: '#D4FF00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  sendBtnText: { color: '#0F1522', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  iosPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  iosPickerContainer: { backgroundColor: '#1C2433', paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  iosPickerDone: { color: '#D4FF00', fontSize: 16, fontWeight: 'bold' },

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
  emptyVenueCard: {
    backgroundColor: '#161C26',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVenueText: { fontSize: 14, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  emptyVenueSubtext: { fontSize: 11, color: '#8A95A5' }
});
