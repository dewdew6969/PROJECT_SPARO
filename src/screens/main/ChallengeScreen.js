import React, { useContext, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, ToastAndroid, Modal, TextInput, RefreshControl, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';
import CustomConfirm from '../../components/CustomConfirm';

const nameCache = {}; // Global cache to prevent massive API flooding

export default function ChallengeScreen({ navigation }) {
  const { t, profile, setPendingMatchesCount } = useAppStore();

  
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingMatches, setPendingMatches] = useState([]);
  const [acceptedMatches, setAcceptedMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for confirm modal
  const [matchToAccept, setMatchToAccept] = useState(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenges().then(() => setRefreshing(false));
  }, []);

  const fetchChallenges = async () => {
    if (!profile?.id) return;
    try {
      const cacheKey = `challenges_${profile.id}`;
      // 1. FAST CACHE LOAD (Optimistic UI)
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached && isLoading) {
         const parsed = JSON.parse(cached);
         const loadedPending = parsed.pending || [];
         setPendingMatches(loadedPending);
         setPendingMatchesCount(loadedPending.length);
         setAcceptedMatches(parsed.accepted || []);
         setCompletedMatches(parsed.completed || []);
         setIsLoading(false); // Stop loading immediately
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/challenges/${profile?.id}?t=${new Date().getTime()}`);
      if (response.ok) {
        const data = await response.json();
        
        // Sort data so newest challenge (highest ID) is always at the top
        const sortedData = data.sort((a, b) => b.id - a.id);

        const formattedData = await Promise.all(sortedData.map(async (match) => {
          // Support both new backend (challenger_id) and old backend (sender_username)
          const isChallenger = match.challenger_id === profile?.id || match.sender_username === profile?.username;
          const enemyId = isChallenger ? match.opponent_id : match.challenger_id;
          const enemyUsername = isChallenger ? match.receiver_username : match.sender_username;
          
          let name = 'Unknown Player';

          try {
            if (enemyId) {
              if (nameCache[enemyId]) {
                name = nameCache[enemyId];
              } else {
                const userRes = await fetch(`${API_URL}/users/${enemyId}`);
                if (userRes.ok) {
                  const userData = await userRes.json();
                  name = userData.full_name || userData.username || name;
                  nameCache[enemyId] = name;
                }
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
            challenger_id: match.challenger_id,
            opponent_id: match.opponent_id,
            name: name,
            sport: match.sport + (match.is_competitive ? ' • Competitive' : ' • Friendly'),
            date: fullDateStr,
            venue: match.venue_name || match.location,
            status: match.status ? match.status.toLowerCase() : 'pending',
            isIncoming: !isChallenger,
            challenger_score: match.challenger_score,
            opponent_score: match.opponent_score,
            challenger: match.challenger,
            opponent: match.opponent
          };
        }));

        const newPending = formattedData.filter(m => m.status === 'pending');
        const newAccepted = formattedData.filter(m => m.status === 'accepted');
        const newCompleted = formattedData.filter(m => m.status === 'completed' || m.status === 'rejected' || m.status === 'awaiting_opponent_verification' || m.status === 'awaiting_challenger_verification' || m.status === 'awaiting_verification' || m.status === 'conflict');

        const newCacheData = {
          pending: newPending,
          accepted: newAccepted,
          completed: newCompleted
        };
        const newCacheStr = JSON.stringify(newCacheData);

        // Hanya update state jika ada perubahan data dari server untuk mencegah layar berkedip
        if (cached !== newCacheStr) {
          setPendingMatches(newPending);
          setPendingMatchesCount(newPending.length);
          setAcceptedMatches(newAccepted);
          setCompletedMatches(newCompleted);
          await AsyncStorage.setItem(cacheKey, newCacheStr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let timeoutId = null;

      const poll = async () => {
        if (!isActive) return;
        await fetchChallenges();
        if (isActive) {
          // Hanya mulai timer baru setelah fetch sebelumnya SELESAI
          timeoutId = setTimeout(poll, 3000);
        }
      };

      poll();
      
      return () => {
        isActive = false;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [profile?.id])
  );

  // Modal state moved to MatchVerificationScreen
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

  const handleAcceptClick = (match) => {
    setMatchToAccept(match);
  };

  const confirmAccept = () => {
    if (matchToAccept) {
      updateStatus(matchToAccept.id, 'accepted');
      setMatchToAccept(null);
    }
  };

  const handleReject = (id) => {
    updateStatus(id, 'rejected');
  };

  const navigateToVerification = (match) => {
    navigation.navigate('MatchVerification', { challenge: match, userId: profile?.id });
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
                <View style={[styles.badgeWarning, !match.isIncoming && { backgroundColor: '#3b2f00' }]}>
                  <Text style={[styles.badgeText, !match.isIncoming && { color: '#D4FF00' }]}>
                    {match.isIncoming ? t('action_required') : 'WAITING FOR OPPONENT'}
                  </Text>
                </View>
              </View>
              <Text style={styles.challengeTitle}>
                {match.isIncoming ? `${t('challenge_from')} ${match.name}` : `Challenge Sent to ${match.name}`}
              </Text>
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
                {match.isIncoming ? (
                  <>
                    <TouchableOpacity style={styles.btnAccept} onPress={() => handleAcceptClick(match)}>
                      <Text style={styles.btnTextAccept}>{t('accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnReject} onPress={() => handleReject(match.id)}>
                      <Text style={styles.btnTextReject}>{t('reject')}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[styles.btnReject, { flex: 1 }]} onPress={() => handleReject(match.id)}>
                    <Text style={styles.btnTextReject}>Cancel Challenge</Text>
                  </TouchableOpacity>
                )}
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
                <TouchableOpacity style={styles.btnPrimary} onPress={() => navigateToVerification(match)}>
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
                <View style={[styles.badgeInfo, { backgroundColor: match.status.includes('awaiting') ? '#4A3B12' : '#1C2E4A' }]}>
                  <Text style={[styles.badgeTextInfo, { color: match.status.includes('awaiting') ? '#FFD700' : '#A0BEFF' }]}>
                    {match.status === 'awaiting_opponent_verification' 
                      ? (match.isIncoming ? "KONFIRMASI SCORE" : "MENUNGGU KONFIRMASI")
                      : match.status === 'awaiting_challenger_verification'
                        ? (match.isIncoming ? "MENUNGGU KONFIRMASI" : "KONFIRMASI SCORE")
                        : (t(match.status) || match.status).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.challengeTitle}>Vs {match.name}</Text>
              <Text style={[styles.detail, { marginBottom: 15 }]}>{match.sport}</Text>
              {((match.status === 'awaiting_opponent_verification' && match.isIncoming) || 
                (match.status === 'awaiting_challenger_verification' && !match.isIncoming) || 
                match.status === 'conflict') && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => navigateToVerification(match)}>
                  <Text style={styles.btnTextPrimary}>{match.status === 'conflict' ? 'Selesaikan Konflik' : 'Konfirmasi Skor'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

        </ScrollView>
      </LinearGradient>

      {/* Confirmation Modal for Accepting Challenge */}
      <CustomConfirm
        visible={!!matchToAccept}
        title="Terima Tantangan?"
        message={matchToAccept ? `Apakah Anda yakin ingin menerima tantangan dari ${matchToAccept.name} untuk bertanding ${matchToAccept.sport}?` : ''}
        confirmText="Terima"
        cancelText="Batal"
        confirmColor="#D4FF00"
        confirmTextColor="#0F1522"
        onCancel={() => setMatchToAccept(null)}
        onConfirm={confirmAccept}
      />

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


});
