import React, { useContext, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, ToastAndroid, Modal, TextInput, RefreshControl, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';

export default function ChallengeScreen() {
  const { t, profile } = useAppStore();

  
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingMatches, setPendingMatches] = useState([]);
  const [acceptedMatches, setAcceptedMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenges().then(() => setRefreshing(false));
  }, []);

  const fetchChallenges = async () => {
    if (!profile?.id) return;
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/challenges/${profile?.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Format data with async mapping to get enemy names
        const formattedData = await Promise.all(data.map(async match => {
          // Support both new backend (challenger_id) and old backend (sender_username)
          const isChallenger = match.challenger_id === profile?.id || match.sender_username === profile?.username;
          const enemyId = isChallenger ? match.opponent_id : match.challenger_id;
          const enemyUsername = isChallenger ? match.receiver_username : match.sender_username;
          
          let name = 'Unknown Player';

          try {
            if (enemyId) {
              const userRes = await fetch(`${API_URL}/users/${enemyId}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                name = userData.full_name || userData.username || name;
              }
            }
            // Fallback to raw username if ID is missing (old backend schema)
            if (name === 'Unknown Player' && enemyUsername) {
              name = enemyUsername;
            }
          } catch (e) {
            console.error('Failed to fetch enemy name', e);
          }
          
          const startDate = new Date(match.match_date || match.date);
          const baseDateStr = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const startTime = startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          let fullDateStr = `${baseDateStr}, ${startTime}`;

          if (match.match_end_date) {
              const endDate = new Date(match.match_end_date);
              const endTime = endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              fullDateStr = `${baseDateStr}, ${startTime} - ${endTime}`;
          }
          
          return {
            id: match.id,
            name: name,
            sport: match.sport + (match.is_competitive ? ' • Competitive' : ' • Friendly'),
            date: fullDateStr,
            venue: match.venue_name || match.location,
            status: match.status ? match.status.toLowerCase() : 'pending',
            isIncoming: !isChallenger
          };
        }));

        setPendingMatches(formattedData.filter(m => m.status === 'pending' && m.isIncoming));
        setAcceptedMatches(formattedData.filter(m => m.status === 'accepted' || (m.status === 'pending' && !m.isIncoming)));
        setCompletedMatches(formattedData.filter(m => m.status === 'completed' || m.status === 'rejected'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchChallenges();
    
    // Polling setiap 2 detik agar BENAR-BENAR realtime
    const intervalId = setInterval(() => {
        fetchChallenges();
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, [profile?.id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchChallenges();
    }, [profile?.id])
  );

  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [myScore, setMyScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [isCompetitiveMatch, setIsCompetitiveMatch] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const updateStatus = async (id, status) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/challenges/${id}/status?status=${status}`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchChallenges();
        if (Platform.OS === 'android') ToastAndroid.show(`Challenge ${status}!`, ToastAndroid.SHORT);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = (match) => {
    updateStatus(match.id, 'accepted');
  };

  const handleReject = (id) => {
    updateStatus(id, 'rejected');
  };

  const openScoreModal = (match) => {
    setSelectedMatchId(match.id);
    setIsCompetitiveMatch(match.sport.toLowerCase().includes('competitive'));
    setMyScore('');
    setOpponentScore('');
    setProofImage(null);
    setScoreModalVisible(true);
  };

  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);

  const pickImage = () => {
    setImagePickerModalVisible(true);
  };

  const handleSubmitScore = async () => {
    if (isCompetitiveMatch && !proofImage) {
      if (Platform.OS === 'android') ToastAndroid.show('Mohon unggah foto bukti skor untuk validasi kemenangan!', ToastAndroid.LONG);
      return;
    }
    
    setIsSubmittingScore(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      
      if (proofImage) {
        const formData = new FormData();
        const filename = proofImage.split('/').pop();
        const match = /\\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('file', { uri: proofImage, name: filename, type });
        
        await fetch(`${API_URL}/challenges/${selectedMatchId}/upload-proof`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      const response = await fetch(`${API_URL}/challenges/${selectedMatchId}/submit-score?user_id=${profile?.id}&my_score=${myScore}&opponent_score=${opponentScore}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setScoreModalVisible(false);
        fetchChallenges();
        if (Platform.OS === 'android') ToastAndroid.show(t('score_submitted_success'), ToastAndroid.LONG);
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'android') ToastAndroid.show('Gagal mengirim skor', ToastAndroid.SHORT);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  if (!profile) return null; // Cegah crash saat profile direset menjadi null ketika proses logout

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('nav_matches')}</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={activeTab === 'pending' ? styles.tabActive : styles.tab} 
            onPress={() => setActiveTab('pending')}
          >
            <Text style={activeTab === 'pending' ? styles.tabTextActive : styles.tabText}>{t('pending')} {pendingMatches.length > 0 && `(${pendingMatches.length})`}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'accepted' ? styles.tabActive : styles.tab} 
            onPress={() => setActiveTab('accepted')}
          >
            <Text style={activeTab === 'accepted' ? styles.tabTextActive : styles.tabText}>{t('accepted')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'completed' ? styles.tabActive : styles.tab} 
            onPress={() => setActiveTab('completed')}
          >
            <Text style={activeTab === 'completed' ? styles.tabTextActive : styles.tabText}>{t('completed')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content} 
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
          
          {isLoading && <Text style={{ color: '#8A95A5', textAlign: 'center', marginTop: 20 }}>Loading matches...</Text>}

          {!isLoading && activeTab === 'pending' && pendingMatches.length === 0 && (
            <Text style={styles.emptyText}>No pending challenges.</Text>
          )}

          {activeTab === 'pending' && pendingMatches.map(match => (
            <View key={match.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeWarning}><Text style={styles.badgeText}>{t('action_required')}</Text></View>
              </View>
              <Text style={styles.challengeTitle}>{t('challenge_from')} {match.name}</Text>
              <View style={styles.detailRow}>
                <Feather name="activity" size={14} color="#8A95A5" />
                <Text style={styles.detail}>{match.sport}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="calendar" size={14} color="#8A95A5" />
                <Text style={styles.detail}>{match.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color="#8A95A5" />
                <Text style={styles.detail}>{match.venue}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.btnAccept} onPress={() => handleAccept(match)}>
                  <Text style={styles.btnTextAccept}>{t('accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(match.id)}>
                  <Text style={styles.btnTextReject}>{t('reject')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!isLoading && activeTab === 'accepted' && acceptedMatches.length === 0 && (
            <Text style={styles.emptyText}>No upcoming matches.</Text>
          )}

          {activeTab === 'accepted' && acceptedMatches.map(match => (
            <View key={match.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badgeInfo, { backgroundColor: match.status === 'pending' ? '#3b2f00' : '#1A362B' }]}>
                  <Text style={[styles.badgeTextInfo, { color: match.status === 'pending' ? '#D4FF00' : '#2ecc71' }]}>
                    {match.status === 'pending' ? 'WAITING FOR OPPONENT' : t('upcoming').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.challengeTitle}>Vs {match.name}</Text>
              <View style={styles.detailRow}>
                <Feather name="activity" size={14} color="#8A95A5" />
                <Text style={styles.detail}>{match.sport}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="calendar" size={14} color="#8A95A5" />
                <Text style={styles.detail}>{match.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color="#8A95A5" />
                <Text style={styles.detail}>{match.venue}</Text>
              </View>
              <View style={[styles.actions, { marginTop: 15 }]}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => openScoreModal(match)}>
                  <Text style={styles.btnTextPrimary}>{t('input_score')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!isLoading && activeTab === 'completed' && completedMatches.length === 0 && (
            <Text style={styles.emptyText}>No completed matches.</Text>
          )}

          {activeTab === 'completed' && completedMatches.map(match => (
            <View key={match.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeInfo}><Text style={styles.badgeTextInfo}>{t(match.status)}</Text></View>
              </View>
              <Text style={styles.challengeTitle}>Vs {match.name}</Text>
              <Text style={[styles.detail, { marginBottom: 15 }]}>{match.sport}</Text>
              {match.status === 'awaiting_verification' && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => openScoreModal(match.id)}>
                  <Text style={styles.btnTextPrimary}>{t('input_score')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

        </ScrollView>
      </LinearGradient>

      {/* Score Modal */}
      <Modal visible={scoreModalVisible} transparent={true} animationType="slide" onRequestClose={() => setScoreModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setScoreModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('input_score')}</Text>
              <TouchableOpacity onPress={() => setScoreModalVisible(false)}>
                <Feather name="x" size={20} color="#8A95A5" />
              </TouchableOpacity>
            </View>

            <View style={styles.scoreInputRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>{t('my_score')}</Text>
                <TextInput 
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={myScore}
                  onChangeText={setMyScore}
                  placeholder="0"
                  placeholderTextColor="#2D3748"
                  maxLength={3}
                />
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>{t('opponent_score')}</Text>
                <TextInput 
                  style={styles.scoreInput}
                  keyboardType="numeric"
                  value={opponentScore}
                  onChangeText={setOpponentScore}
                  placeholder="0"
                  placeholderTextColor="#2D3748"
                  maxLength={3}
                />
              </View>
            </View>

            {isCompetitiveMatch && (
              <View style={styles.proofSection}>
                <Text style={styles.proofLabel}>Wajib Unggah Foto Papan Skor (Validasi) <Text style={{ color: '#FF4D4D' }}>*</Text></Text>
                <TouchableOpacity style={styles.proofBtn} onPress={pickImage}>
                  {proofImage ? (
                    <Image source={{ uri: proofImage }} style={styles.proofImagePreview} />
                  ) : (
                    <View style={styles.proofPlaceholder}>
                      <Feather name="camera" size={32} color="#8A95A5" />
                      <Text style={styles.proofPlaceholderText}>Ambil Foto Skor</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.btnSubmitScore, (!myScore || !opponentScore || (isCompetitiveMatch && !proofImage) || isSubmittingScore) && { opacity: 0.5 }]} 
              disabled={!myScore || !opponentScore || (isCompetitiveMatch && !proofImage) || isSubmittingScore}
              onPress={handleSubmitScore}
            >
              <Text style={styles.btnTextSubmitScore}>{isSubmittingScore ? 'MENGIRIM...' : t('submit_score')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Image Picker Modal */}
      <Modal visible={imagePickerModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImagePickerModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setImagePickerModalVisible(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>Unggah Foto Skor</Text>
            </View>
            <TouchableOpacity style={styles.actionSheetItem} onPress={async () => {
              setImagePickerModalVisible(false);
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                if (Platform.OS === 'android') ToastAndroid.show('Izin kamera ditolak', ToastAndroid.SHORT);
                return;
              }
              let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled) {
                setProofImage(result.assets[0].uri);
              }
            }}>
              <Feather name="camera" size={20} color="#FFF" style={{ marginRight: 15 }} />
              <Text style={styles.actionSheetText}>Kamera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionSheetItem} onPress={async () => {
              setImagePickerModalVisible(false);
              let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled) {
                setProofImage(result.assets[0].uri);
              }
            }}>
              <Feather name="image" size={20} color="#FFF" style={{ marginRight: 15 }} />
              <Text style={styles.actionSheetText}>Galeri</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  tabActive: { paddingVertical: 10, flex: 1, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#D4FF00' },
  tab: { paddingVertical: 10, flex: 1, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#2D3748' },
  tabTextActive: { color: '#D4FF00', fontWeight: 'bold' },
  tabText: { color: '#8A95A5', fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#121824', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#233045' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  badgeWarning: { backgroundColor: '#4A3B12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeInfo: { backgroundColor: '#1C2E4A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  badgeTextInfo: { color: '#A0BEFF', fontSize: 10, fontWeight: 'bold' },
  timeAgo: { color: '#5C677D', fontSize: 12 },
  challengeTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detail: { fontSize: 14, color: '#C2D0E8', marginLeft: 8 },
  actions: { flexDirection: 'row', marginTop: 20, gap: 10 },
  btnAccept: { flex: 1, backgroundColor: '#D4FF00', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnTextAccept: { color: '#000', fontWeight: 'bold' },
  btnReject: { flex: 1, backgroundColor: '#2D3748', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnTextReject: { color: '#FFF', fontWeight: 'bold' },
  btnPrimary: { backgroundColor: '#D4FF00', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnTextPrimary: { color: '#0F1522', fontWeight: 'bold' },
  emptyText: { color: '#8A95A5', textAlign: 'center', marginTop: 50, fontSize: 16 },

  // Score Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,24,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161C26', width: '100%', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2D3748' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  scoreInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  scoreBox: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: '#8A95A5', marginBottom: 10, fontWeight: 'bold' },
  scoreInput: { backgroundColor: '#0F1522', color: '#FFF', fontSize: 32, fontWeight: 'bold', width: 80, height: 80, textAlign: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#233045' },
  vsText: { color: '#D4FF00', fontWeight: 'bold', fontSize: 16, marginHorizontal: 15, marginTop: 25 },
  proofSection: { marginBottom: 25 },
  proofLabel: { fontSize: 12, color: '#8A95A5', marginBottom: 10, fontWeight: 'bold' },
  proofBtn: { backgroundColor: '#0F1522', height: 120, borderRadius: 12, borderWidth: 1, borderColor: '#233045', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  proofPlaceholder: { alignItems: 'center' },
  proofPlaceholderText: { color: '#8A95A5', marginTop: 8, fontSize: 12 },
  proofImagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  btnSubmitScore: { backgroundColor: '#D4FF00', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnTextSubmitScore: { color: '#0F1522', fontWeight: 'bold', fontSize: 16 },

  // Action Sheet for Image Picker
  actionSheet: { backgroundColor: '#1C2433', width: '100%', position: 'absolute', bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  actionSheetHeader: { marginBottom: 20, alignItems: 'center' },
  actionSheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#8A95A5' },
  actionSheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  actionSheetText: { fontSize: 16, color: '#FFF' }
});
