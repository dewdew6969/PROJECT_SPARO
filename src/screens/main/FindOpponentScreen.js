import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, StatusBar, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAppStore from '../../store/useAppStore';
import { Image } from 'expo-image';

const SkeletonCard = () => {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatarImage, { backgroundColor: '#2D3748', marginRight: 15 }]} />
        <View style={styles.cardInfo}>
          <View style={{ width: '60%', height: 20, backgroundColor: '#2D3748', borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '40%', height: 15, backgroundColor: '#2D3748', borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '30%', height: 15, backgroundColor: '#2D3748', borderRadius: 4 }} />
        </View>
      </View>
      <View style={styles.cardActions}>
        <View style={[styles.btnOutline, { backgroundColor: '#2D3748', borderColor: 'transparent', height: 45 }]} />
        <View style={[styles.btnPrimary, { backgroundColor: '#2D3748', height: 45 }]} />
      </View>
    </Animated.View>
  );
};

export default function FindOpponentScreen({ navigation }) {
  const { profile, t, language } = useAppStore();

  const userElo = profile?.elo || 1500;
  const [isLoading, setIsLoading] = useState(true);
  const [opponents, setOpponents] = useState([]);

  // Single-select: Default to primary sport
  const [activeSport, setActiveSport] = useState(profile?.primarySport || 'Badminton');
  const [showAllSportsModal, setShowAllSportsModal] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Applied filters
  const [appliedLevel, setAppliedLevel] = useState('ALL');
  const [appliedDistance, setAppliedDistance] = useState('ALL');
  const [appliedMinElo, setAppliedMinElo] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'distance', 'sportsmanship'

  // Temp filters (inside modal)
  const [tempLevel, setTempLevel] = useState('ALL');
  const [tempDistance, setTempDistance] = useState('ALL');
  const [tempMinElo, setTempMinElo] = useState('ALL');
  const [tempSortBy, setTempSortBy] = useState('rating');

  const openFilterModal = () => {
    setTempLevel(appliedLevel);
    setTempDistance(appliedDistance);
    setTempMinElo(appliedMinElo);
    setTempSortBy(sortBy);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setAppliedLevel(tempLevel);
    setAppliedDistance(tempDistance);
    setAppliedMinElo(tempMinElo);
    setSortBy(tempSortBy);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempLevel('ALL');
    setTempDistance('ALL');
    setTempMinElo('ALL');
    setTempSortBy('rating');
  };

  const isFilterApplied = appliedLevel !== 'ALL' || appliedDistance !== 'ALL' || appliedMinElo !== 'ALL';

  // Update active sport ONLY when profile?.primarySport changes
  useEffect(() => {
    if (profile?.primarySport) {
      setActiveSport(profile.primarySport);
    }
  }, [profile?.primarySport]);

  // Fetch opponents from backend or fallback to mock
  useEffect(() => {
    let isMounted = true;
    
    const fetchOpponents = async () => {
      try {
        const cacheKey = `find_opponents_${profile?.id}_${activeSport}_${appliedDistance}_${appliedMinElo}`;
        
        // 1. FAST CACHE LOAD (Optimistic UI)
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && isMounted) {
           setOpponents(JSON.parse(cached));
           // Jangan block UI dengan loader jika cache sudah ada!
        } else {
           setIsLoading(true);
        }

        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        let url = `${API_URL}/opponents/`;
        const params = new URLSearchParams();
        
        // Pass coordinates for real distance calculation if available
        if (profile?.latitude && profile?.longitude) {
          params.append('lat', profile.latitude);
          params.append('lon', profile.longitude);
        }
        
        // Pass max distance filter
        if (appliedDistance !== 'ALL') {
          params.append('max_distance', appliedDistance);
        }
        
        params.append('t', Date.now()); // Prevent caching at network level
        
        if (params.toString()) {
          url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('API failed');
        
        const data = await response.json();
        
        // Map backend User data to Frontend Opponent format
        if (isMounted) {
          const mappedOpponents = data.filter(u => u.id !== profile?.id).map(u => {
            let finalAvatar = u.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
            // Perbaiki URL lokal menjadi URL publik dinamis
            if (finalAvatar && finalAvatar !== 'null' && !finalAvatar.includes('gravatar.com') && !finalAvatar.startsWith('file://') && !finalAvatar.startsWith('content://')) {
               try {
                 const urlObj = new URL(finalAvatar);
                 finalAvatar = `${API_URL}${urlObj.pathname}${urlObj.search}`;
               } catch (e) {
                 finalAvatar = finalAvatar.startsWith('/') ? `${API_URL}${finalAvatar}` : `${API_URL}/${finalAvatar}`;
               }
            }
            
            return {
              id: String(u.id),
              name: u.full_name || u.username,
              elo: u.elo || 1500,
              level: u.primary_level || 'BEGINNER',
              distance: u.distance !== null ? `${u.distance} km` : '0 km',
              matches: 0,
              wins: 0,
              isPro: u.elo > 1600,
              avatar: finalAvatar,
              sports: [u.primary_sport, u.secondary_sport].filter(Boolean),
              winRate: 0
            };
          });
          
          if (mappedOpponents.length > 0) {
             setOpponents(mappedOpponents);
             await AsyncStorage.setItem(cacheKey, JSON.stringify(mappedOpponents)); // Save to cache
          } else {
             setOpponents([]);
             await AsyncStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.log("Failed to fetch from backend:", error);
        if (isMounted && opponents.length === 0) {
          setOpponents([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchOpponents();
    return () => { isMounted = false; };
  }, [activeSport, appliedLevel, appliedDistance, appliedMinElo, searchQuery, profile?.latitude, profile?.longitude]);

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

  const sports = allSports.slice(0, 4);

  const MOCK_OPPONENTS = [];

  const filteredOpponents = opponents
    .filter(op => {
      // 1. Filter by Active Sport Category
      const matchesSport = op.sports.includes(activeSport);
      
      // 2. Filter by Search Query (Name or sports)
      const matchesSearch = searchQuery.trim() === '' || 
        op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.sports.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      // 3. Filter by Level
      const matchesLevel = appliedLevel === 'ALL' || 
        op.level.toUpperCase() === appliedLevel.toUpperCase();

      // 4. Filter by Distance
      let matchesDistance = true;
      if (appliedDistance !== 'ALL') {
        const opDist = parseFloat(op.distance);
        const maxDist = parseFloat(appliedDistance);
        matchesDistance = opDist <= maxDist;
      }

      // 5. Filter by Min ELO
      let matchesElo = true;
      if (appliedMinElo !== 'ALL') {
        const minEloNum = parseInt(appliedMinElo, 10);
        matchesElo = op.elo >= minEloNum;
      }

      return matchesSport && matchesSearch && matchesLevel && matchesDistance && matchesElo;
    })
    .sort((a, b) => {
      // 6. Sort
      if (sortBy === 'rating') {
        return b.elo - a.elo; // Higher ELO first
      } else if (sortBy === 'distance') {
        return parseFloat(a.distance) - parseFloat(b.distance); // Closer distance first
      } else if (sortBy === 'sportsmanship') {
        return b.winRate - a.winRate; // Higher win rate first
      }
      return 0;
    });

  if (!profile) return null; // Cegah crash saat profile direset menjadi null ketika proses logout

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.headerLogo}>{t('find_opponent_title')}</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#8A95A5" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder={t('search_placeholder')} 
              placeholderTextColor="#5C677D"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color="#8A95A5" style={{ marginRight: 5 }} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={openFilterModal}>
            <Feather name="sliders" size={20} color={isFilterApplied ? '#D4FF00' : '#C2D0E8'} />
            {isFilterApplied && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.sportsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsRow}>
            {sports.map((sport) => {
              const isActive = activeSport === sport.name;
              return (
                <TouchableOpacity 
                  key={sport.id} 
                  style={styles.sportItem}
                  onPress={() => setActiveSport(sport.name)}
                >
                  <View style={[styles.sportIconCircle, isActive && styles.sportIconCircleActive]}>
                    <MaterialCommunityIcons 
                      name={sport.icon} 
                      size={24} 
                      color={isActive ? '#000000' : '#8A95A5'} 
                    />
                  </View>
                  <Text style={[styles.sportText, isActive && styles.sportTextActive]}>
                    {t('sport_' + sport.name.toLowerCase().replace(/ /g, '_'))}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* More Categories Button */}
            <TouchableOpacity 
              style={styles.sportItem}
              onPress={() => setShowAllSportsModal(true)}
            >
              <View style={styles.sportIconCircle}>
                <Feather name="plus" size={24} color="#8A95A5" />
              </View>
              <Text style={styles.sportText}>{t('any')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('recommended')}</Text>
              <Text style={styles.sectionSubtitle}>{filteredOpponents.length} {t('available_nearby')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.sortBtn} 
              onPress={() => {
                // Cycle sort: rating -> distance -> sportsmanship -> rating
                if (sortBy === 'rating') {
                  setSortBy('distance');
                } else if (sortBy === 'distance') {
                  setSortBy('sportsmanship');
                } else {
                  setSortBy('rating');
                }
              }}
            >
              {sortBy === 'rating' ? (
                <>
                  <Feather name="bar-chart-2" size={14} color="#D4FF00" />
                  <Text style={[styles.sortText, { color: '#D4FF00' }]}>{t('elo_rating')}</Text>
                </>
              ) : sortBy === 'distance' ? (
                <>
                  <Feather name="map-pin" size={14} color="#D4FF00" />
                  <Text style={[styles.sortText, { color: '#D4FF00' }]}>{t('distance').toUpperCase()}</Text>
                </>
              ) : (
                <>
                  <Feather name="percent" size={14} color="#D4FF00" />
                  <Text style={[styles.sortText, { color: '#D4FF00' }]}>{t('win_rate')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredOpponents.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#1C2433', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                 <MaterialCommunityIcons name="account-search" size={60} color="#2D3748" />
              </View>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{t('no_opponents') === 'no_opponents' ? 'Belum Ada Lawan' : t('no_opponents')}</Text>
              <Text style={{ color: '#8A95A5', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 }}>
                Maaf, belum ada lawan untuk {t('sport_' + activeSport.toLowerCase().replace(/ /g, '_'))} dengan kriteria yang Anda cari saat ini.
              </Text>
            </View>
          ) : (
            filteredOpponents.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  
                  <View style={styles.avatarContainer}>
                    <Image 
                      source={{ uri: item.avatar }} 
                      style={styles.avatarImage} 
                      cachePolicy="memory-disk"
                      transition={0}
                    />
                    {item.isPro && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.name}</Text>
                      <View style={styles.ratingBox}>
                        <Text style={styles.ratingVal}>{item.elo}</Text>
                        <Text style={styles.ratingLabel}>{t('elo_rating')}</Text>
                      </View>
                    </View>

                    <View style={styles.levelRow}>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>{t(item.level.toLowerCase()).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.distanceText}> • {item.distance} {t('away')}</Text>
                    </View>

                    <View style={styles.scoreRow}>
                      <Feather name="percent" size={12} color="#D4FF00" style={{ marginRight: 4 }} />
                      <Text style={styles.scoreVal}>{item.winRate}%</Text>
                      <Text style={styles.scoreLabel}> {t('win_rate')}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.btnOutline}
                    onPress={() => navigation.navigate('OpponentProfile', { opponent: item })}
                  >
                    <Text style={styles.btnTextOutline}>{t('view_profile')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnPrimary}
                    onPress={() => navigation.navigate('CreateChallenge', { opponent: item })}
                  >
                    <Text style={styles.btnTextPrimary}>{t('send_challenge')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          
          <View style={{ height: 60 }} />
        </ScrollView>

        {/* All Sports Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAllSportsModal}
          onRequestClose={() => setShowAllSportsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('all_categories')}</Text>
                <TouchableOpacity onPress={() => setShowAllSportsModal(false)}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalGrid}>
                {allSports.map((sport) => {
                  const isActive = activeSport === sport.name;
                  return (
                    <TouchableOpacity 
                      key={sport.id} 
                      style={styles.modalSportItem}
                      onPress={() => {
                        setActiveSport(sport.name);
                        setShowAllSportsModal(false);
                      }}
                    >
                      <View style={[styles.modalSportIcon, isActive && styles.sportIconCircleActive]}>
                        <MaterialCommunityIcons name={sport.icon} size={28} color={isActive ? '#000' : '#8A95A5'} />
                      </View>
                      <Text style={[styles.modalSportText, isActive && styles.sportTextActive]}>{t('sport_' + sport.name.toLowerCase().replace(/ /g, '_'))}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showFilterModal}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="sliders" size={20} color="#D4FF00" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>{t('filter_opponent')}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Level Kemampuan */}
                <Text style={styles.filterSectionTitle}>{t('skill_level')}</Text>
                <View style={styles.filterOptionsGrid}>
                  {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.filterOptionPill,
                        tempLevel === level && styles.filterOptionPillActive
                      ]}
                      onPress={() => setTempLevel(level)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        tempLevel === level && styles.filterOptionTextActive
                      ]}>
                        {level === 'ALL' ? t('any') : t(level.toLowerCase()).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Jarak Maksimal */}
                <Text style={styles.filterSectionTitle}>{t('maximum_distance')}</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: t('any'), value: 'ALL' },
                    { label: '< 2 km', value: '2' },
                    { label: '< 5 km', value: '5' },
                    { label: '< 10 km', value: '10' }
                  ].map((dist) => (
                    <TouchableOpacity
                      key={dist.value}
                      style={[
                        styles.filterOptionPill,
                        tempDistance === dist.value && styles.filterOptionPillActive
                      ]}
                      onPress={() => setTempDistance(dist.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        tempDistance === dist.value && styles.filterOptionTextActive
                      ]}>
                        {dist.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Min ELO Rating */}
                <Text style={styles.filterSectionTitle}>{t('min_elo_rating')}</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: t('any'), value: 'ALL' },
                    { label: `${userElo}+`, value: `${userElo}` },
                    { label: `${userElo + 200}+`, value: `${userElo + 200}` },
                    { label: `${userElo + 500}+`, value: `${userElo + 500}` }
                  ].map((eloOpt) => (
                    <TouchableOpacity
                      key={eloOpt.value}
                      style={[
                        styles.filterOptionPill,
                        tempMinElo === eloOpt.value && styles.filterOptionPillActive
                      ]}
                      onPress={() => setTempMinElo(eloOpt.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        tempMinElo === eloOpt.value && styles.filterOptionTextActive
                      ]}>
                        {eloOpt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Urutan */}
                <Text style={styles.filterSectionTitle}>{t('sort_based_on')}</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: t('rating_elo'), value: 'rating' },
                    { label: t('closest_distance'), value: 'distance' },
                    { label: t('sportsmanship'), value: 'sportsmanship' }
                  ].map((sortOpt) => (
                    <TouchableOpacity
                      key={sortOpt.value}
                      style={[
                        styles.filterOptionPill,
                        tempSortBy === sortOpt.value && styles.filterOptionPillActive
                      ]}
                      onPress={() => setTempSortBy(sortOpt.value)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        tempSortBy === sortOpt.value && styles.filterOptionTextActive
                      ]}>
                        {sortOpt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.filterActionRow}>
                <TouchableOpacity style={styles.filterResetBtn} onPress={resetFilters}>
                  <Text style={styles.filterResetText}>{t('reset')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilters}>
                  <Text style={styles.filterApplyText}>{t('apply_filter')}</Text>
                </TouchableOpacity>
              </View>
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
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 0, paddingBottom: 15 },
  headerLogo: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#161C26', borderRadius: 12, 
    borderWidth: 1, borderColor: '#2D3748', 
    height: 50, paddingHorizontal: 15, marginRight: 10 
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15 },
  filterBtn: { 
    width: 50, height: 50, backgroundColor: '#1C2433', 
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2D3748'
  },

  sportsContainer: { marginBottom: 25 },
  sportsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 20 },
  sportItem: { alignItems: 'center', width: 60 },
  sportIconCircle: { 
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: '#161C26', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: '#2D3748'
  },
  sportIconCircleActive: { backgroundColor: '#D4FF00', borderColor: '#D4FF00' },
  sportText: { color: '#8A95A5', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sportTextActive: { color: '#FFF', fontWeight: 'bold' },

  scrollContent: { paddingHorizontal: 20 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  sectionSubtitle: { fontSize: 10, color: '#8A95A5', fontWeight: 'bold', letterSpacing: 1 },
  sortBtn: { flexDirection: 'row', alignItems: 'center' },
  sortText: { color: '#C2D0E8', fontSize: 12, fontWeight: 'bold', marginLeft: 5, letterSpacing: 1 },

  card: { backgroundColor: '#161C26', padding: 18, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#2D3748' },
  cardTop: { flexDirection: 'row', marginBottom: 15 },
  
  avatarContainer: { marginRight: 15, position: 'relative' },
  avatarImage: { width: 65, height: 65, borderRadius: 16, borderWidth: 1, borderColor: '#2D3748' },
  proBadge: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#D4FF00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  
  cardInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  ratingBox: { alignItems: 'flex-end' },
  ratingVal: { fontSize: 18, fontWeight: '900', color: '#D4FF00' },
  ratingLabel: { fontSize: 9, color: '#8A95A5', fontWeight: 'bold', marginTop: 2 },
  
  levelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  levelBadge: { backgroundColor: '#233045', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  levelText: { color: '#A0BEFF', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  distanceText: { color: '#8A95A5', fontSize: 12 },
  
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreVal: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  scoreLabel: { color: '#8A95A5', fontSize: 12 },
  
  cardActions: { flexDirection: 'row', gap: 12 },
  btnOutline: { flex: 1, backgroundColor: '#1C2433', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2D3748' },
  btnTextOutline: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  btnPrimary: { flex: 1, backgroundColor: '#D4FF00', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnTextPrimary: { color: '#0F1522', fontWeight: 'bold', fontSize: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#161C26', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#2D3748' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  modalSportItem: { width: '22%', alignItems: 'center', marginBottom: 20 },
  modalSportIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1C2433', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#2D3748' },
  modalSportText: { color: '#8A95A5', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Filter Modal specific styles
  filterSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#8A95A5', marginTop: 15, marginBottom: 10, letterSpacing: 0.5 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  filterOptionPill: { 
    paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 20, backgroundColor: '#1C2433', 
    borderWidth: 1, borderColor: '#2D3748', 
    marginBottom: 5
  },
  filterOptionPillActive: { 
    backgroundColor: '#D4FF00', borderColor: '#D4FF00' 
  },
  filterOptionText: { color: '#C2D0E8', fontSize: 13, fontWeight: '600' },
  filterOptionTextActive: { color: '#0F1522', fontWeight: 'bold' },
  
  filterActionRow: { 
    flexDirection: 'row', gap: 15, marginTop: 25, 
    paddingTop: 15, borderTopWidth: 1, borderTopColor: '#2D3748' 
  },
  filterResetBtn: { 
    flex: 1, paddingVertical: 14, borderRadius: 12, 
    alignItems: 'center', backgroundColor: '#1C2433', 
    borderWidth: 1, borderColor: '#2D3748' 
  },
  filterResetText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  filterApplyBtn: { 
    flex: 2, paddingVertical: 14, borderRadius: 12, 
    alignItems: 'center', backgroundColor: '#D4FF00' 
  },
  filterApplyText: { color: '#0F1522', fontWeight: 'bold', fontSize: 15 },
  
  filterDot: {
    position: 'absolute', top: 5, right: 5,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#D4FF00', borderWidth: 1.5, borderColor: '#1C2433'
  }
});
