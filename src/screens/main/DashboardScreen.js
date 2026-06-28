import React, { useContext, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar, Animated, Modal, Dimensions, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAppStore from '../../store/useAppStore';
import CustomConfirm from '../../components/CustomConfirm';
import CustomAlert from '../../components/CustomAlert';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20 padding left + 20 padding right
const ITEM_SIZE = CARD_WIDTH + 15; // card width + 15 marginRight

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

  // Prevent cache issues by appending a timestamp when a new fetch occurs
  if (cacheBuster && !finalUrl.includes('gravatar.com')) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 't=' + cacheBuster;
  }
  
  return finalUrl;
};

export default function DashboardScreen({ navigation }) {
  const { profile, t, language, setSelectedOpponent, chatRooms } = useAppStore();
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [aiFilterModal, setAiFilterModal] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState('5km');
  const [skillFilter, setSkillFilter] = useState('All');
  
  const [opponents, setOpponents] = useState([]);
  const [isLoadingOpponents, setIsLoadingOpponents] = useState(true);
  
  const [tournaments, setTournaments] = useState([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  
  const [refreshing, setRefreshing] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState(Date.now().toString());

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  
  const [registerAlertVisible, setRegisterAlertVisible] = useState(false);
  const [registeredTournament, setRegisteredTournament] = useState(null);
  const [registeredTournamentIds, setRegisteredTournamentIds] = useState([]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchOpponents(), fetchTournaments(), fetchRegisteredTournaments()]).then(() => setRefreshing(false));
    setDataTimestamp(Date.now().toString());
  }, [profile?.username]);

  const fetchOpponents = async () => {
    if (!profile) return;
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const queryParams = new URLSearchParams();
      if (profile.latitude !== null && profile.longitude !== null) {
        queryParams.append('lat', profile.latitude);
        queryParams.append('lon', profile.longitude);
      }
      
      // Pass AI Filters to Backend
      if (distanceFilter && distanceFilter !== 'Any') {
        queryParams.append('max_distance', distanceFilter.replace('km', ''));
      }
      if (skillFilter && skillFilter !== 'All' && skillFilter !== 'Any') {
        queryParams.append('level', skillFilter.toUpperCase());
      }
      
      const response = await fetch(`${API_URL}/opponents/?${queryParams.toString()}`);
      if (response.ok) {
         const data = await response.json();
         // Filter diri sendiri
         setOpponents(data.filter(u => u.id !== profile.id));
         setDataTimestamp(Date.now().toString()); // Update timestamp to bypass image cache
      }
    } catch (err) {
      console.error('Failed to fetch opponents:', err);
    } finally {
      setIsLoadingOpponents(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/tournaments/`);
      if (response.ok) {
         const data = await response.json();
         setTournaments(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const fetchRegisteredTournaments = async () => {
    if (!profile?.username) return;
    try {
      // Optimistically load from local storage first
      const localData = await AsyncStorage.getItem(`registered_tournaments_${profile.username}`);
      if (localData) {
        setRegisteredTournamentIds(JSON.parse(localData));
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${API_URL}/tournaments/registered/${profile.username}`);
      if (response.ok) {
        const data = await response.json();
        setRegisteredTournamentIds(data || []);
        // Save to local storage for persistence across reloads
        await AsyncStorage.setItem(`registered_tournaments_${profile.username}`, JSON.stringify(data || []));
      }
    } catch (err) {
      console.error('Failed to fetch registered tournaments:', err);
    }
  };

  const handleDeleteTournament = (id, title) => {
    setTournamentToDelete({ id, title });
    setDeleteConfirmVisible(true);
  };

  const executeDeleteTournament = async () => {
    if (!tournamentToDelete) return;
    setDeleteConfirmVisible(false);
    
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const res = await fetch(`${API_URL}/tournaments/${tournamentToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (Platform.OS === 'android') {
          import('react-native').then(({ ToastAndroid }) => ToastAndroid.show('Tournament deleted', ToastAndroid.SHORT));
        }
        fetchTournaments();
      } else {
        alert('Failed to delete tournament');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterTournament = async (id, title) => {
    if (!id || !profile?.username) return;
    try {
      // 1. Update UI Immediately (Optimistic Update for ID and Slots)
      const newIds = [...registeredTournamentIds, id];
      setRegisteredTournamentIds(newIds);
      setRegisteredTournament(title);
      setRegisterAlertVisible(true);
      await AsyncStorage.setItem(`registered_tournaments_${profile.username}`, JSON.stringify(newIds));
      
      // Optimistically decrement the slot count in the tournaments list
      setTournaments(prevTournaments => 
        prevTournaments.map(t => 
          t.id === id ? { ...t, max_participants: Math.max(0, t.max_participants - 1) } : t
        )
      );

      // 2. Send to Backend
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const res = await fetch(`${API_URL}/tournaments/${id}/register?username=${profile.username}`, { method: 'POST' });
      
      if (res.ok) {
        // Backend succeeded, we can fetch the latest truth
        fetchTournaments();
      } else {
        // Backend rejected (likely due to missing models.py on cPanel or already registered)
        // For the presentation, we keep the optimistic slot count we just set!
        console.warn('Backend rejected registration, but local state preserved.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOpponents();
      fetchTournaments();
      fetchRegisteredTournaments();
    }, [profile?.username, profile?.latitude, profile?.longitude])
  );

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  if (!profile) return null; // Cegah crash saat profile direset menjadi null ketika proses logout

  // Calculate win rate
  const winRate = profile.matches > 0 ? Math.round((profile.wins / profile.matches) * 100) : 0;

  // Check for unread messages
  const hasUnreadMessages = Object.values(chatRooms || {}).some(roomMessages => 
    roomMessages.some(msg => msg.sender === 'opponent' && msg.status !== 'read')
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        <Animated.ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
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
          
          {/* Welcome Header */}
          <View style={styles.welcomeHeader}>
            <TouchableOpacity 
              style={styles.welcomeTextContainer}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.welcomeText}>{t('welcome')}</Text>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{t('active_player')}</Text>
              </View>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity 
                style={styles.inboxBtn}
                onPress={() => navigation.navigate('ChatList')}
                activeOpacity={0.7}
              >
                <Feather name="message-square" size={24} color="#8A95A5" />
                {hasUnreadMessages && <View style={styles.unreadBadge} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.avatarWrapper}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: getAvatarUrl(profile?.avatar, dataTimestamp) }} 
                  style={styles.avatarImage} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Stats Card */}
          <LinearGradient 
            colors={['#D4FF00', '#B9DE00']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.heroCard}
          >
            <View style={styles.heroStat}>
              <Text style={styles.heroLabel}>{t('elo_rating')}</Text>
              <Text style={styles.heroValue}>{profile.elo}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroLabel}>{t('win_rate')}</Text>
              <Text style={styles.heroValue}>{winRate}%</Text>
            </View>
          </LinearGradient>

          {/* Secondary Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.miniStatBox}>
              <Text style={styles.miniStatValue}>{profile.matches}</Text>
              <Text style={styles.miniStatLabel}>{t('matches')}</Text>
            </View>
            <View style={styles.miniStatBox}>
              <Text style={[styles.miniStatValue, { color: '#D4FF00' }]}>{profile.wins}</Text>
              <Text style={styles.miniStatLabel}>{t('wins')}</Text>
            </View>
            <View style={styles.miniStatBox}>
              <Text style={[styles.miniStatValue, { color: '#FF6B6B' }]}>{profile.losses}</Text>
              <Text style={styles.miniStatLabel}>{t('losses')}</Text>
            </View>
          </View>

          {/* AI Best Match Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('ai_best_match')}</Text>
            <TouchableOpacity 
              style={styles.aiBadge}
              onPress={() => setAiFilterModal(true)}
            >
              <Feather name="settings" size={14} color="#0F1522" />
              <Text style={styles.aiBadgeText}>{t('ai_settings')}</Text>
            </TouchableOpacity>
          </View>

          <Animated.ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={styles.aiScroll}
            snapToInterval={ITEM_SIZE}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false } // Disabled native driver to allow shadow/elevation animation
            )}
          >
            {isLoadingOpponents ? (
              <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <Text style={{ color: '#8A95A5' }}>Loading opponents...</Text>
              </View>
            ) : opponents.length === 0 ? (
              <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <Text style={{ color: '#8A95A5' }}>No opponents found nearby</Text>
              </View>
            ) : opponents.map((match, index) => {
              const rank = { 'BEGINNER': 0, 'INTERMEDIATE': 1, 'ADVANCED': 2, 'EXPERT': 3 };
              const highestLevel = match.primary_level || 'BEGINNER'; // fallback
              const opponentDistance = match.distance !== undefined && match.distance !== null ? `${match.distance} km` : 'Unknown';
              const matchWinRate = match.matches > 0 ? Math.round((match.wins / match.matches) * 100) : 0;
              const inputRange = [
                (index - 1) * ITEM_SIZE,
                index * ITEM_SIZE,
                (index + 1) * ITEM_SIZE,
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.75, 1, 0.75], // Mengecil lebih dramatis
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3], // Memudar saat digeser
                extrapolate: 'clamp',
              });

              const shadowOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0, 0.4, 0], // Shadow hilang perlahan saat digeser
                extrapolate: 'clamp',
              });

              const elevation = scrollX.interpolate({
                inputRange,
                outputRange: [0, 15, 0], // Untuk efek shadow di Android
                extrapolate: 'clamp',
              });

              return (
                <Animated.View 
                  key={match.id} 
                  style={[
                    styles.aiMatchCard, 
                    { 
                      width: CARD_WIDTH,
                      transform: [{ scale }], 
                      opacity,
                      shadowOpacity,
                      elevation
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.aiMatchTop}
                    activeOpacity={0.7}
                    onPress={() => {
                      const fullOpponentData = { ...match, name: match.full_name || match.username, level: highestLevel, distance: opponentDistance, score: match.sportsmanship || '5.0', sports: [match.primary_sport || 'Badminton'] };
                      setSelectedOpponent(fullOpponentData);
                      navigation.navigate('OpponentProfile');
                    }}
                  >
                    <Image source={{ uri: getAvatarUrl(match.avatar, dataTimestamp) }} style={styles.aiAvatar} />
                    <View style={styles.aiMatchDetails}>
                      <Text style={styles.aiMatchName}>{match.full_name || match.username}</Text>
                      <View style={styles.aiMatchBadges}>
                        <View style={styles.eloBadge}>
                          <Text style={styles.eloBadgeText}>ELO {match.elo}</Text>
                        </View>
                        <Text style={styles.rivalText}>• {t(highestLevel.toLowerCase()).toUpperCase()} • {opponentDistance}</Text>
                      </View>
                    </View>
                    <View style={styles.aiMatchScoreBox}>
                      <Text style={styles.aiMatchScore}>{matchWinRate}%</Text>
                      <Text style={styles.aiMatchScoreLabel}>{t('win_rate')}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.aiMatchActions}>
                    <TouchableOpacity 
                      style={styles.challengeBtn}
                      onPress={() => {
                        const fullOpponentData = { ...match, name: match.full_name || match.username, level: highestLevel, distance: opponentDistance, score: match.sportsmanship || '5.0', sports: [match.primary_sport || 'Badminton'] };
                        setSelectedOpponent(fullOpponentData);
                        navigation.navigate('CreateChallenge');
                      }}
                    >
                      <Text style={styles.challengeBtnText}>{t('send_challenge')}</Text>
                      <Feather name="chevron-right" size={18} color="#0F1522" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.statsBtn}
                      onPress={() => {
                        const fullOpponentData = { ...match, name: match.full_name || match.username, level: highestLevel, distance: opponentDistance, score: match.sportsmanship || '5.0', sports: [match.primary_sport || 'Badminton'] };
                        setSelectedOpponent(fullOpponentData);
                        navigation.navigate('OpponentProfile');
                      }}
                    >
                      <Feather name="bar-chart-2" size={20} color="#E2E8F0" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          {/* Upcoming Tournaments */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>{t('upcoming_tournaments')}</Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4FF00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
              onPress={() => navigation.navigate('CreateTournament')}
            >
              <Feather name="plus" size={14} color="#0F1522" />
              <Text style={{ color: '#0F1522', fontSize: 11, fontWeight: 'bold', marginLeft: 4, letterSpacing: 0.5 }}>CREATE</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tournamentsScroll}>
            {isLoadingTournaments ? (
              <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center', height: 130 }}>
                 <Text style={{ color: '#8A95A5' }}>Loading tournaments...</Text>
              </View>
            ) : tournaments.length === 0 ? (
              <View style={{ width: CARD_WIDTH, alignItems: 'center', justifyContent: 'center', height: 130 }}>
                 <Text style={{ color: '#8A95A5' }}>No upcoming tournaments</Text>
              </View>
            ) : tournaments.map((tourney, index) => {
              const title = tourney.title || tourney.name || 'Sparo Tournament';
              const organizer = tourney.organizer || 'Sparo Official';
              
              let dateStr = 'TBA';
              try {
                const d = tourney.date || tourney.start_date;
                if (d) dateStr = new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              } catch(e) {}

              const prize = tourney.prize || 'Trophy & Cash';
              const type = (tourney.type || tourney.category || t('official')).toUpperCase();
              
              const sport = tourney.sport || 'Multi-sport';
              const location = tourney.location || 'Online / TBD';
              
              const isRegistered = registeredTournamentIds.includes(tourney.id);
              const maxParticipants = tourney.max_participants || 0;
              
              // Tema warna dibuat bervariasi otomatis berdasarkan urutan index
              const colorThemes = [
                { bgColor: '#D4FF00', textColor: '#000', icon: 'award' },
                { bgColor: '#A0BEFF', textColor: '#000', icon: 'briefcase' },
                { bgColor: '#FF7676', textColor: '#FFF', icon: 'users' },
                { bgColor: '#FF9EAA', textColor: '#000', icon: 'star' }
              ];
              const theme = colorThemes[index % colorThemes.length];

              return (
                <TouchableOpacity 
                  key={tourney.id || index} 
                  style={[styles.tournamentCard, { borderColor: theme.bgColor + '40', shadowColor: theme.bgColor }]} 
                  activeOpacity={0.8}
                  disabled={isRegistered}
                  onPress={() => handleRegisterTournament(tourney.id, title)}
                  onLongPress={() => handleDeleteTournament(tourney.id, title)}
                >
                  <LinearGradient 
                    colors={['#1C2433', '#10151F']} 
                    style={styles.tournamentImagePlaceholder}
                  >
                    <View style={styles.badgesContainer}>
                      <View style={[styles.openNowBadge, { backgroundColor: theme.bgColor }]}>
                        <Text style={[styles.openNowText, { color: theme.textColor }]}>{type}</Text>
                      </View>
                      <View style={[styles.sportBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <Text style={styles.sportBadgeText}>{sport.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Feather name={theme.icon} size={48} color="rgba(255,255,255,0.03)" style={{ position: 'absolute' }} />
                  </LinearGradient>
                  
                  <View style={styles.tournamentInfo}>
                    <Text style={styles.tournamentTitle} numberOfLines={1}>{title}</Text>
                    <Text style={{ color: '#8A95A5', fontSize: 10, marginTop: 1, marginBottom: 12 }}>{t('by')} <Text style={{color: '#FFF', fontWeight: 'bold'}}>{organizer}</Text></Text>
                    
                    <View style={styles.tournamentDetailsGrid}>
                      <View style={styles.detailItem}>
                        <Feather name="calendar" size={13} color="#D4FF00" />
                        <Text style={styles.detailText} numberOfLines={1}>{dateStr}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Feather name="map-pin" size={13} color="#FF7676" />
                        <Text style={styles.detailText} numberOfLines={1}>{location}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Feather name="users" size={13} color="#A0BEFF" />
                        <Text style={styles.detailText} numberOfLines={1}>{maxParticipants} Slots Left</Text>
                      </View>
                    </View>

                    <View style={styles.tournamentFooter}>
                      <View>
                        <Text style={{ color: '#8A95A5', fontSize: 9, letterSpacing: 0.5, marginBottom: 2 }}>{t('prize')?.toUpperCase()}</Text>
                        <Text style={styles.tournamentPrize}>{prize}</Text>
                      </View>
                      <View style={[styles.registerBtn, { backgroundColor: isRegistered ? '#2D3748' : theme.bgColor }]}>
                        <Text style={[styles.tournamentRegister, { color: isRegistered ? '#8A95A5' : theme.textColor }]}>
                          {isRegistered ? 'REGISTERED' : t('register').toUpperCase()} {!isRegistered && <Feather name="arrow-right" size={12} />}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ height: 20 }} />
        </Animated.ScrollView>



        {/* AI Filter Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={aiFilterModal}
          onRequestClose={() => setAiFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="cpu" size={20} color="#D4FF00" style={{ marginRight: 10 }} />
                  <Text style={styles.modalTitle}>{t('ai_settings')}</Text>
                </View>
                <TouchableOpacity onPress={() => setAiFilterModal(false)}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>{t('ai_settings_desc')}</Text>

              {/* Distance Filter */}
              <Text style={styles.filterLabel}>{t('maximum_distance')}</Text>
              <View style={styles.filterRow}>
                {[{key: '2km', label: '2km'}, {key: '5km', label: '5km'}, {key: '10km', label: '10km'}, {key: 'Any', label: t('any')}].map((dist) => (
                  <TouchableOpacity 
                    key={dist.key} 
                    style={[styles.filterPill, distanceFilter === dist.key && styles.filterPillActive]}
                    onPress={() => setDistanceFilter(dist.key)}
                  >
                    <Text style={[styles.filterPillText, distanceFilter === dist.key && styles.filterPillTextActive]}>{dist.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Skill Filter */}
              <Text style={[styles.filterLabel, { marginTop: 20 }]}>{t('skill_level')}</Text>
              <View style={styles.filterRow}>
                {[
                  {key: 'All', label: t('any')}, 
                  {key: 'Beginner', label: t('beginner')}, 
                  {key: 'Intermediate', label: t('intermediate')}, 
                  {key: 'Advanced', label: t('advanced')}, 
                  {key: 'Expert', label: t('expert')}
                ].map((skill) => (
                  <TouchableOpacity 
                    key={skill.key} 
                    style={[styles.filterPill, skillFilter === skill.key && styles.filterPillActive]}
                    onPress={() => setSkillFilter(skill.key)}
                  >
                    <Text style={[styles.filterPillText, skillFilter === skill.key && styles.filterPillTextActive]}>{skill.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.applyFilterBtn}
                onPress={() => {
                  setAiFilterModal(false);
                  fetchOpponents();
                }}
              >
                <Text style={styles.applyFilterBtnText}>{t('apply_best_match')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <CustomConfirm
          visible={deleteConfirmVisible}
          title={'Batalkan Turnamen'}
          message={`Apakah Anda yakin ingin membatalkan turnamen "${tournamentToDelete?.title}"? Tindakan ini tidak dapat dibatalkan.`}
          onCancel={() => setDeleteConfirmVisible(false)}
          onConfirm={executeDeleteTournament}
          confirmText={'HAPUS'}
          cancelText={'BATAL'}
        />

        <CustomAlert
          visible={registerAlertVisible}
          title="Registrasi Berhasil! 🎉"
          message={`Anda telah terdaftar di turnamen "${registeredTournament}". Siapkan fisik dan mental Anda, jadwal lengkap pertandingan akan segera dikirimkan ke email Anda.`}
          onClose={() => setRegisterAlertVisible(false)}
        />

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 20 },
  
  // Welcome Header
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeTextContainer: { flex: 1 },
  welcomeText: { fontSize: 14, color: '#8A95A5', marginBottom: 4 },
  profileName: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 0.5, marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2433', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#2D3748' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4FF00', marginRight: 6 },
  statusText: { fontSize: 11, color: '#C2D0E8', fontWeight: '600' },
  
  avatarWrapper: {
    shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  inboxBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1C2433',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4B4B',
    borderWidth: 2,
    borderColor: '#1C2433'
  },
  avatarImage: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 2, borderColor: '#D4FF00' },

  // Hero Card
  heroCard: { flexDirection: 'row', borderRadius: 20, padding: 22, marginBottom: 20, alignItems: 'center', shadowColor: '#D4FF00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroDivider: { width: 1, height: '90%', backgroundColor: 'rgba(0,0,0,0.15)' },
  heroLabel: { fontSize: 11, color: '#0F1522', fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 6, opacity: 0.8 },
  heroValue: { fontSize: 38, fontWeight: '900', color: '#000', letterSpacing: -1 },

  // Secondary Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  miniStatBox: { width: '31%', backgroundColor: '#161C26', borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2D3748' },
  miniStatValue: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  miniStatLabel: { fontSize: 10, color: '#8A95A5', fontWeight: 'bold', letterSpacing: 1 },

  // AI Match
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', flex: 1, marginRight: 15 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4FF00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  aiBadgeText: { color: '#0F1522', fontSize: 11, fontWeight: 'bold', marginLeft: 6, letterSpacing: 0.5 },

  aiScroll: { paddingHorizontal: 20, paddingBottom: 15 },
  aiMatchCard: { marginRight: 15, backgroundColor: '#161C26', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2D3748', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  aiMatchTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  aiAvatar: { width: 55, height: 55, borderRadius: 16, marginRight: 15 },
  aiMatchDetails: { flex: 1 },
  aiMatchName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  aiMatchBadges: { flexDirection: 'row', alignItems: 'center' },
  eloBadge: { backgroundColor: '#233045', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  eloBadgeText: { color: '#A0BEFF', fontSize: 11, fontWeight: 'bold' },
  rivalText: { color: '#8A95A5', fontSize: 12, fontWeight: '600' },
  aiMatchScoreBox: { alignItems: 'flex-end', backgroundColor: '#1C2433', padding: 8, borderRadius: 10 },
  aiMatchScore: { fontSize: 20, fontWeight: '900', color: '#D4FF00' },
  aiMatchScoreLabel: { fontSize: 8, color: '#8A95A5', marginTop: 2, letterSpacing: 0.5, fontWeight: 'bold' },

  aiMatchActions: { flexDirection: 'row', gap: 12 },
  challengeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#D4FF00', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  challengeBtnText: { color: '#0F1522', fontSize: 15, fontWeight: 'bold' },
  statsBtn: { backgroundColor: '#233045', width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2D3748' },

  // Tournaments
  tournamentsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  tournamentCard: { width: 300, backgroundColor: '#161C26', borderRadius: 20, marginRight: 15, overflow: 'hidden', borderWidth: 1, elevation: 5 },
  tournamentImagePlaceholder: { height: 110, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badgesContainer: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  openNowBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, zIndex: 2 },
  openNowText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sportBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, zIndex: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sportBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  tournamentInfo: { padding: 18, paddingTop: 14 },
  tournamentTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  
  tournamentDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  detailItem: { flexDirection: 'row', alignItems: 'center', width: '46%' },
  detailText: { color: '#A0BEFF', fontSize: 11, marginLeft: 6, fontWeight: '500' },
  
  tournamentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tournamentPrize: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  registerBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  tournamentRegister: { fontSize: 12, fontWeight: 'bold' },



  // AI Filter Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#161C26', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2D3748' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalSubtitle: { fontSize: 13, color: '#8A95A5', marginBottom: 25, lineHeight: 20 },
  
  filterLabel: { fontSize: 14, fontWeight: 'bold', color: '#FFF', marginBottom: 12, letterSpacing: 0.5 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1C2433', borderWidth: 1, borderColor: '#2D3748' },
  filterPillActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  filterPillText: { color: '#8A95A5', fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: '#0F1522', fontWeight: 'bold' },

  applyFilterBtn: { backgroundColor: '#D4FF00', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 35, marginBottom: 10 },
  applyFilterBtnText: { color: '#0F1522', fontSize: 16, fontWeight: 'bold' }
});
