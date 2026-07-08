import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Modal, ToastAndroid } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ZoomableImage from '../../components/profile/ZoomableImage';
import * as ScreenCapture from 'expo-screen-capture';
import useAppStore from '../../store/useAppStore';
import CustomAlert from '../../components/CustomAlert';
import { Image } from 'expo-image';

const getSportIcon = (sportName) => {
  if (!sportName) return 'badminton';
  const s = String(sportName).toLowerCase();
  if (s.includes('basket')) return 'basketball';
  if (s.includes('mini soccer')) return 'soccer-field';
  if (s.includes('futsal') || s.includes('soccer') || s.includes('football') || s.includes('bola')) return 'soccer';
  if (s.includes('tennis') || s.includes('tenis')) return 'tennis';
  if (s.includes('ping') || s.includes('table')) return 'table-tennis';
  if (s.includes('voli') || s.includes('volley')) return 'volleyball';
  if (s.includes('billiard')) return 'billiards';
  if (s.includes('e-sport') || s.includes('esport') || s.includes('game')) return 'gamepad-variant';
  if (s.includes('chess') || s.includes('catur')) return 'chess-knight';
  if (s.includes('golf')) return 'golf';
  if (s.includes('run') || s.includes('lari')) return 'run';
  if (s.includes('cycl') || s.includes('sepeda') || s.includes('bike')) return 'bike';
  if (s.includes('swim') || s.includes('renang')) return 'swim';
  if (s.includes('gym') || s.includes('fitness')) return 'dumbbell';
  return 'badminton';
};

const getAvatarUrl = (str, cacheBuster = null) => {
  if (!str || str === "null") return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
  let finalUrl = str;
  if (str.includes('gravatar.com') || str.startsWith('file://') || str.startsWith('content://')) {
    finalUrl = str;
  } else if (str.startsWith('http://') || str.startsWith('https://')) {
    if (!str.includes('localhost') && !str.includes('127.0.0.1') && !str.includes('10.0.2.2')) {
      finalUrl = str;
    } else {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      try {
        const urlObj = new URL(str);
        finalUrl = `${apiUrl}${urlObj.pathname}${urlObj.search}`;
      } catch (e) {
        finalUrl = str.startsWith('/') ? `${apiUrl}${str}` : `${apiUrl}/${str}`;
      }
    }
  } else {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    try {
      const urlObj = new URL(str);
      finalUrl = `${apiUrl}${urlObj.pathname}${urlObj.search}`;
    } catch (e) {
      finalUrl = str.startsWith('/') ? `${apiUrl}${str}` : `${apiUrl}/${str}`;
    }
  }

  // cacheBuster removed to prevent image flash with expo-image
  
  return finalUrl;
};

export default function OpponentProfileScreen({ navigation, route }) {
  const { t, language, selectedOpponent } = useAppStore();
  
  // Prioritize route params (fresh click) over Zustand's global state
  const initialOpponent = route.params?.opponent || selectedOpponent || {
    id: '0',
    name: 'Unknown Player',
    elo: 1400,
    level: 'INTERMEDIATE',
    distance: '2.0 km',
    score: '4.8',
    isPro: false,
    avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    sports: ['Badminton']
  };

  const [opponent, setOpponent] = React.useState(initialOpponent);
  
  React.useEffect(() => {
    let intervalId;
    const fetchOpponentData = async () => {
      if (!opponent.id || opponent.id === '0') return;
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await fetch(`${apiUrl}/users/${opponent.id}?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          // Pertahankan properti lama yang mungkin tidak ada di DB (misal distance)
          setOpponent(prev => ({
            ...prev,
            ...data,
            name: data.full_name || data.username || prev.name,
            level: data.primary_level || prev.level,
            sports: [data.primary_sport, data.secondary_sport].filter(Boolean)
          }));
        }
      } catch (err) {
        console.log("Failed to poll opponent data:", err);
      }
    };

    // Initial fetch
    fetchOpponentData();

    // Auto-polling setiap 3 detik (hemat baterai, performa lebih baik dari sebelumnya)
    intervalId = setInterval(fetchOpponentData, 3000);

    return () => clearInterval(intervalId);
  }, [opponent.id]);
  const [isZoomVisible, setIsZoomVisible] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState({ visible: false, title: '', message: '' });
  const [actionSheetVisible, setActionSheetVisible] = React.useState(false);
  const [reportModalVisible, setReportModalVisible] = React.useState(false);
  const [dataTimestamp] = React.useState(Date.now().toString());

  React.useEffect(() => {
    let subscription;
    const preventScreenshot = async () => {
      if (isZoomVisible) {
        await ScreenCapture.preventScreenCaptureAsync();
        subscription = ScreenCapture.addScreenshotListener(() => {
          ToastAndroid.show(t('screenshot_restricted'), ToastAndroid.LONG);
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
  }, [isZoomVisible, t]);


  // Use actual data strictly from the opponent object fetched from DB
  const matches = opponent.matches || 0;
  const wins = opponent.wins || 0;
  const losses = opponent.losses || 0;
  const winRate = opponent.winRate !== undefined ? `${opponent.winRate}%` : `${matches > 0 ? Math.round((wins / matches) * 100) : 0}%`;
  const trustScore = opponent.trustScore || 100;
  const availableDays = opponent.availableDays ? opponent.availableDays.split(',').map(d => d.trim().toLowerCase()) : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const availableTime = opponent.availableTime || 'Any time';
  const primarySport = opponent.primarySport || (opponent.sports && opponent.sports[0]) || 'Unknown';
  const secondarySport = opponent.secondarySport || (opponent.sports && opponent.sports[1]) || 'None';
  
  const safeAvatar = getAvatarUrl(opponent.avatar, dataTimestamp);
  const safeName = opponent.name || 'Unknown Player';
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('opponent_profile')}</Text>
          <TouchableOpacity 
            style={styles.moreBtn}
            onPress={() => setActionSheetVisible(true)}
          >
            <Feather name="more-vertical" size={20} color="#8A95A5" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Profile Info */}
          <View style={styles.heroSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => setIsZoomVisible(true)} activeOpacity={0.8}>
              <Image source={{ uri: safeAvatar }} style={styles.avatar} />
              {opponent.isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.name}>{safeName}</Text>
            <Text style={styles.username}>@{safeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}</Text>
            
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color="#8A95A5" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>
                {opponent.distance ? `${opponent.distance} away • ` : ''} 
                {opponent.location || 'Lokasi Belum Diatur'}
              </Text>
            </View>

            {/* Main Stats Header Cards */}
            <View style={styles.statsOverviewRow}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{opponent.elo}</Text>
                <Text style={styles.overviewLabel}>ELO RATING</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={[styles.overviewValue, { color: '#A0BEFF' }]}>{t(opponent.level.toLowerCase()).toUpperCase()}</Text>
                <Text style={styles.overviewLabel}>SKILL LEVEL</Text>
              </View>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnMessage} 
              onPress={() => navigation.navigate('Chat', { opponent })}
            >
              <Feather name="message-square" size={20} color="#FFF" />
              <Text style={styles.btnMessageText}>{t('message')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.btnChallenge}
              onPress={() => navigation.navigate('CreateChallenge', { opponent })}
            >
              <MaterialCommunityIcons name="sword-cross" size={20} color="#0F1522" />
              <Text style={styles.btnChallengeText}>{t('send_challenge')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sports_category')}</Text>
            <View style={styles.card}>
              <View style={styles.sportRowDetail}>
                <View style={styles.sportIconCircle}>
                  <MaterialCommunityIcons 
                    name={getSportIcon(primarySport)} 
                    size={20} 
                    color="#D4FF00" 
                  />
                </View>
                <View style={styles.sportTextDetail}>
                  <Text style={styles.sportName}>{t('sport_' + primarySport.toLowerCase().replace(/ /g, '_'))}</Text>
                  <Text style={styles.sportLevel}>{t('primary_sport')} • {t(opponent.level.toLowerCase()).toUpperCase()}</Text>
                </View>
              </View>
              
              {opponent.sports.length > 1 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.sportRowDetail}>
                    <View style={styles.sportIconCircle}>
                      <MaterialCommunityIcons 
                        name={getSportIcon(secondarySport)} 
                        size={20} 
                        color="#8A95A5" 
                      />
                    </View>
                    <View style={styles.sportTextDetail}>
                      <Text style={styles.sportName}>{t('sport_' + secondarySport.toLowerCase().replace(/ /g, '_'))}</Text>
                      <Text style={styles.sportLevel}>{t('secondary_sport')} • {t('intermediate').toUpperCase()}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Performance Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('match_statistics')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.gridCard}>
                <Text style={styles.gridValue}>{matches}</Text>
                <Text style={styles.gridLabel}>{t('matches_played')}</Text>
              </View>
              <View style={styles.gridCard}>
                <Text style={[styles.gridValue, { color: '#D4FF00' }]}>{winRate}</Text>
                <Text style={styles.gridLabel}>{t('win_rate')}</Text>
              </View>
              <View style={styles.gridCard}>
                <Text style={[styles.gridValue, { color: '#2ecc71' }]}>{wins}</Text>
                <Text style={styles.gridLabel}>{t('wins')}</Text>
              </View>
              <View style={styles.gridCard}>
                <Text style={[styles.gridValue, { color: '#e74c3c' }]}>{losses}</Text>
                <Text style={styles.gridLabel}>{t('losses')}</Text>
              </View>
            </View>
          </View>

          {/* Reputation & Trust Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('trust_reputation')}</Text>
            <View style={styles.card}>
              <View style={styles.reputationRow}>
                <View style={styles.repIconBox}>
                  <Feather name="shield" size={18} color="#D4FF00" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.repTitleRow}>
                    <Text style={styles.repTitle}>{t('trust_score')}</Text>
                    <Text style={[styles.repValue, { color: '#D4FF00' }]}>{trustScore}%</Text>
                  </View>
                  <Text style={styles.repDesc}>{t('trust_desc')}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.reputationRow}>
                <View style={styles.repIconBox}>
                  <Feather name="star" size={18} color="#A0BEFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.repTitleRow}>
                    <Text style={styles.repTitle}>{t('sportsmanship')}</Text>
                    <Text style={[styles.repValue, { color: '#A0BEFF' }]}>{Number(opponent.score).toFixed(1)} / 5.0</Text>
                  </View>
                  <Text style={styles.repDesc}>{t('sportsmanship_desc')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('availability')}</Text>
            <View style={styles.card}>
              <View style={styles.availRow}>
                <Feather name="calendar" size={16} color="#8A95A5" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.availLabel}>{t('days')}</Text>
                  <Text style={styles.availValue}>{availableDays.map(d => t(d)).join(', ')}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.availRow}>
                <Feather name="clock" size={16} color="#8A95A5" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.availLabel}>{t('time')}</Text>
                  <Text style={styles.availValue}>{availableTime}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

      </LinearGradient>

      {/* Image Zoom Modal */}
      <Modal visible={isZoomVisible} transparent={true} animationType="fade" onRequestClose={() => setIsZoomVisible(false)}>
        <GestureHandlerRootView style={styles.modalBackground}>
          <TouchableOpacity style={styles.closeZoomBtn} onPress={() => setIsZoomVisible(false)}>
            <Feather name="x" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <ZoomableImage uri={safeAvatar} />
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Action Sheet Modal */}
      <Modal visible={actionSheetVisible} transparent={true} animationType="slide" onRequestClose={() => setActionSheetVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setActionSheetVisible(false)}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetDragHandle} />
            
            <TouchableOpacity style={styles.sheetBtn} onPress={() => { setActionSheetVisible(false); setAlertConfig({ visible: true, title: t('block_user'), message: t('feature_unavailable') }); }}>
              <Feather name="slash" size={20} color="#FF4B4B" style={{ marginRight: 15 }} />
              <Text style={[styles.sheetBtnText, { color: '#FF4B4B' }]}>{t('block_user')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetBtn} onPress={() => { setActionSheetVisible(false); setTimeout(() => setReportModalVisible(true), 300); }}>
              <Feather name="flag" size={20} color="#FFF" style={{ marginRight: 15 }} />
              <Text style={styles.sheetBtnText}>{t('report_user')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Reasons Modal */}
      <Modal visible={reportModalVisible} transparent={true} animationType="slide" onRequestClose={() => setReportModalVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setReportModalVisible(false)}>
          <View style={[styles.sheetContent, { paddingBottom: 30 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('report_reason_title')}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Feather name="x" size={20} color="#8A95A5" />
              </TouchableOpacity>
            </View>
            
            {['reason_spam', 'reason_inappropriate', 'reason_harassment', 'reason_fake'].map((reasonKey) => (
              <TouchableOpacity 
                key={reasonKey} 
                style={styles.reasonBtn}
                onPress={() => {
                  setReportModalVisible(false);
                  ToastAndroid.show(t('report_success'), ToastAndroid.LONG);
                }}
              >
                <Text style={styles.reasonText}>{t(reasonKey)}</Text>
                <Feather name="chevron-right" size={16} color="#8A95A5" />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1C2433' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  moreBtn: { padding: 5 },
  
  scrollContent: { padding: 20 },
  
  heroSection: { alignItems: 'center', marginTop: 15, marginBottom: 25 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#D4FF00' },
  proBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#D4FF00', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 2, borderColor: '#0F1522' },
  proText: { fontSize: 9, fontWeight: '900', color: '#0F1522' },
  
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  username: { fontSize: 14, color: '#A0BEFF', fontWeight: 'bold', marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { color: '#8A95A5', fontSize: 13 },
  
  statsOverviewRow: { flexDirection: 'row', width: '100%', gap: 15, justifyContent: 'center' },
  overviewCard: { flex: 1, maxWidth: 160, backgroundColor: '#161C26', borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2D3748' },
  overviewValue: { fontSize: 18, fontWeight: '900', color: '#D4FF00', marginBottom: 4 },
  overviewLabel: { fontSize: 9, color: '#8A95A5', fontWeight: 'bold', letterSpacing: 1 },

  actionRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  btnMessage: { flex: 1, backgroundColor: '#1C2433', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2D3748', gap: 8 },
  btnMessageText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  btnChallenge: { flex: 1, backgroundColor: '#D4FF00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnChallengeText: { color: '#0F1522', fontSize: 15, fontWeight: 'bold' },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#5C677D', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  card: { backgroundColor: '#121824', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#233045' },
  divider: { height: 1, backgroundColor: '#1C2433', marginVertical: 15 },

  // Sports details
  sportRowDetail: { flexDirection: 'row', alignItems: 'center' },
  sportIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C2433', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#2D3748' },
  sportTextDetail: { flex: 1 },
  sportName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  sportLevel: { fontSize: 12, color: '#8A95A5' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '48%', backgroundColor: '#121824', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#233045' },
  gridValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  gridLabel: { fontSize: 11, color: '#8A95A5' },

  // Reputation & Trust
  reputationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  repIconBox: { marginRight: 15, marginTop: 2 },
  repTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  repTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  repValue: { fontSize: 16, fontWeight: 'bold' },
  repDesc: { fontSize: 11, color: '#5C677D', lineHeight: 16 },

  // Availability
  availRow: { flexDirection: 'row', alignItems: 'center' },
  availLabel: { fontSize: 12, color: '#8A95A5', marginBottom: 2 },
  availValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },

  // Zoom Modal
  modalBackground: { flex: 1, backgroundColor: 'rgba(10, 15, 24, 0.95)', justifyContent: 'center', alignItems: 'center' },
  closeZoomBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  zoomedImage: { width: '90%', height: '70%', borderRadius: 16 },

  // Action Sheet & Modals
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(10,15,24,0.6)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: '#161C26', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  sheetDragHandle: { width: 40, height: 4, backgroundColor: '#2D3748', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#1C2433' },
  sheetBtnText: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  reasonBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C2433', padding: 16, borderRadius: 12, marginBottom: 10 },
  reasonText: { color: '#FFF', fontSize: 15, fontWeight: '500' }
});
